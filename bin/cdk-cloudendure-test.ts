#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { CdkCloudendureTestStack } from '../lib/cdk-cloudendure-test-stack';

const app = new cdk.App();
new CdkCloudendureTestStack(app, 'CdkCloudendureTestStack');
