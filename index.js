'use strict';

const AWS = require('aws-sdk');
const randomstring = require('randomstring');
const chalk = require('chalk');

class CloudfrontInvalidate {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options || {};

    this.commands = {
      cloudfrontInvalidate: {
        usage: "Invalidate Cloudfront Cache",
        lifecycleEvents: [
          'invalidate'
        ]
      }
    };

    this.hooks = {
      'after:deploy:deploy': this.invalidate.bind(this),
      'cloudfrontInvalidate:invalidate': this.invalidate.bind(this),
    };
  }

  invalidate() {
    const cli = this.serverless.cli;
    let cloudfrontInvalidate = this.serverless.service.custom.cloudfrontInvalidate;
    let awsCredentials = this.serverless.getProvider('aws').getCredentials()
    let cloudfront = new AWS.CloudFront({
        credentials: awsCredentials.credentials
    });
    let reference = randomstring.generate(16);
    let distributionId = cloudfrontInvalidate.distributionId;
    if (!distributionId) {
      if (!cloudfrontInvalidate.distributionIdKey) {
        cli.consoleLog('distributionId or distributionIdKey is required');
        return;
      }
      // get the id from the output of stack.
      const cfn = new AWS.CloudFormation({
        credentials: awsCredentials.credentials,
        region: this.serverless.getProvider('aws').getRegion()
      });
      const stackName = `${this.serverless.service.getServiceName()}-${this.serverless.getProvider('aws').getStage()}`
      cfn.describeStacks({ StackName: stackName }).promise()
      .then(result => {
        if (result) {
          const outputs = result.Stacks[0].Outputs;
          outputs.forEach(output => {
            if (output.OutputKey === cloudfrontInvalidate.distributionIdKey) {
              distributionId = output.OutputValue;
            }
          });
        }
      })
      .then(() => {
        let params = {
          DistributionId: distributionId, /* required */
          InvalidationBatch: { /* required */
            CallerReference: reference, /* required */
            Paths: { /* required */
                Quantity: cloudfrontInvalidate.items.length, /* required */
                Items: cloudfrontInvalidate.items
            }
          }
        };
        cloudfront.createInvalidation(params, function (err, data) {
          if (!err){
            cli.consoleLog(`CloudfrontInvalidate: ${chalk.yellow('Invalidation started')}`);
          } else{
            console.log(JSON.stringify(err));
            cli.consoleLog(`CloudfrontInvalidate: ${chalk.yellow('Invalidation failed')}`);
          }
        });
      })
      .catch(error => {
        cli.consoleLog('Failed to get DistributionId from stack output. Please check your serverless template.');
        return;
      });
    }
  }
}

module.exports = CloudfrontInvalidate;