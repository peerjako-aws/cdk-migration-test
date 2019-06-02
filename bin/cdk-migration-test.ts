#!/usr/bin/env node
import 'source-map-support/register';
import cdk = require('@aws-cdk/cdk');
import { SourceStack } from '../lib/source-stack';
import { DestinationStack } from '../lib/destination-stack';

const app = new cdk.App();
new SourceStack(app, 'SourceStack', {
    env: {
      region: "eu-west-1"
    }
});

new DestinationStack(app, 'DestinationStack', {
    env: {
      region: "eu-north-1"
    }
});
