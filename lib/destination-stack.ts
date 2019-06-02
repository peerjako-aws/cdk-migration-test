import cdk = require('@aws-cdk/cdk');
import ec2 = require('@aws-cdk/aws-ec2');

export class DestinationStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    new ec2.Vpc(this, 'DestinationVPC', {
       maxAZs: 2,
      cidr: '172.16.0.0/16'
    });
     
  }
}