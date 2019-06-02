import cdk = require('@aws-cdk/cdk');
import secrets = require('@aws-cdk/aws-secretsmanager');
import ssm = require('@aws-cdk/aws-ssm');
import iam = require('@aws-cdk/aws-iam');
import ec2 = require('@aws-cdk/aws-ec2');
import autoscaling = require('@aws-cdk/aws-autoscaling');
import yaml = require('js-yaml');
import { String } from 'typescript-string-operations';
import * as fs from 'fs';
import * as path from 'path';

import { keyPairName, awsCloudEndureTokenSecretsArn } from '../config'


export class SourceStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create source resources
    const sourceVpc = new ec2.Vpc(this, 'SourceVPC', {
      maxAZs: 2,
      cidr: '10.1.0.0/16'
    });

    // Joomla
    const securityGroup = new ec2.SecurityGroup(this, 'JoomlaSecurityGroup', {
      allowAllOutbound: true,
      groupName: 'JoomlaSecurityGroup',
      vpc: sourceVpc
    });
    securityGroup.addIngressRule(new ec2.AnyIPv4(), new ec2.TcpPort(80), 'allow http access from any ipv4 ip');
    securityGroup.addIngressRule(new ec2.AnyIPv4(), new ec2.TcpPort(443), 'allow https access from any ipv4 ip');

    // Create an instance role that allow reading the cloudendure-token value from AWS Secrets Manager    
    const cloudEndureToken = secrets.Secret.fromSecretArn(this, 'CloudEndureSecret', awsCloudEndureTokenSecretsArn);
    const instanceRole = new iam.Role(this, 'CloudEndureMigrationIR', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    instanceRole.attachManagedPolicy('arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM');
    cloudEndureToken.grantRead(instanceRole);

    const instanceProfile =  new iam.CfnInstanceProfile(this, 'CloudEndureMigrationIP', {
      roles: [instanceRole.roleName]
    })
    
    // Create Joomla by Jetware instance using an autoscaling group
    // You need to accept t&a here: https://aws.amazon.com/marketplace/pp/B072R6Q7N3
    const asgJoomla = new autoscaling.AutoScalingGroup(this, 'ASGJoomla', {
      vpc: sourceVpc,
      role: instanceRole,
      instanceType: new ec2.InstanceType('t3.medium'),
      machineImage: new ec2.GenericLinuxImage({
        "eu-west-1": "ami-193b3d60"
      }),
      vpcSubnets: {
        subnetType: ec2.SubnetType.Public
      },
      keyName: keyPairName
    });
    asgJoomla.addSecurityGroup(securityGroup);
    new cdk.CfnOutput(this, 'JoomlaASGName', { value: asgJoomla.autoScalingGroupName });

    // Create Linux SSM Command Document for installing CloudEndure agent
    let commandDataString = fs.readFileSync(path.join(__dirname, 'cloudendure-command-document.yaml'), 'utf8');
    let commandData = yaml.load(String.Format(commandDataString, 
      awsCloudEndureTokenSecretsArn,
      this.env.region+'')
    );

    const linuxInstallCloudEndureDocument = new ssm.CfnDocument(this, 'LinuxInstallCloudEndure', {
      content: commandData,
      documentType: 'Command',
      tags: [
        {
          key: "Name",
          value: "LinuxInstallCloudEndure"
        }
      ]
    });
    
    new cdk.CfnOutput(this, 'LinuxInstallCloudEndureDocumentName', { value: linuxInstallCloudEndureDocument.documentName });
    
  }
}
