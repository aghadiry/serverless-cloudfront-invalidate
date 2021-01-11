'use strict';

const randomstring = require('randomstring');
const chalk = require('chalk');
const fs = require('fs');
const https = require('https');
const proxy = require('proxy-agent');

class CloudfrontInvalidate {

  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options || {};
    this.proxyURL =
      process.env.proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy ||
      process.env.HTTPS_PROXY ||
      process.env.https_proxy;
    this.provider = 'aws';
    this.aws = this.serverless.getProvider('aws');

    if (this.proxyURL) {
      this.setProxy(this.proxyURL);
    }

    if (this.options.cacert) {
      this.handleCaCert(this.options.cacert);
    }

    this.commands = {
      cloudfrontInvalidate: {
        usage: "Invalidate Cloudfront Cache",
        lifecycleEvents: [
          'invalidate'
        ]
      }
    };

    this.hooks = {
      'cloudfrontInvalidate:invalidate': this.invalidate.bind(this),
    };

    if (serverless.service.custom.cloudfrontInvalidate.autoInvalidate !== false) {
      this.hooks['after:deploy:deploy'] = this.invalidate.bind(this)
    }
  }

  setProxy(proxyURL) {
    this.aws.sdk.config.update({
      httpOptions: { agent: proxy(proxyURL) },
    });
  }

  handleCaCert(caCert) {
    const cli = this.serverless.cli;

    if (!fs.existsSync(caCert)) {
      throw new Error("Supplied cacert option to a file that does not exist: " + caCert);
    }

    this.aws.sdk.config.update({
      httpOptions: { agent: new https.Agent({ ca: fs.readFileSync(caCert)}) }
    });

    cli.consoleLog(`CloudfrontInvalidate: ${chalk.yellow('ca cert handling enabled')}`);
  }

  createInvalidation(distributionId, reference) {
    const cli = this.serverless.cli;
    const cloudfrontInvalidateItems = this.serverless.service.custom.cloudfrontInvalidate.items;

    const params = {
      DistributionId: distributionId, /* required */
      InvalidationBatch: { /* required */
        CallerReference: reference, /* required */
        Paths: { /* required */
            Quantity: cloudfrontInvalidateItems.length, /* required */
            Items: cloudfrontInvalidateItems
        }
      }
    };
    return this.aws.request('CloudFront', 'createInvalidation', params).then(
      () => {
        cli.consoleLog(`CloudfrontInvalidate: ${chalk.yellow('Invalidation started')}`);
      },
      err => {
        cli.consoleLog(JSON.stringify(err));
        cli.consoleLog(`CloudfrontInvalidate: ${chalk.yellow('Invalidation failed')}`);
        throw err;
      }
    );
  }

  invalidate() {
    const cli = this.serverless.cli;
    let cloudfrontInvalidate = this.serverless.service.custom.cloudfrontInvalidate;
    let reference = randomstring.generate(16);
    let distributionId = cloudfrontInvalidate.distributionId;
    if (distributionId) {
      cli.consoleLog(`DistributionId: ${chalk.yellow(distributionId)}`);
      return this.createInvalidation(distributionId, reference);
    }

    if (!cloudfrontInvalidate.distributionIdKey) {
      cli.consoleLog('distributionId or distributionIdKey is required');
      return;
    }

    cli.consoleLog(`DistributionIdKey: ${chalk.yellow(cloudfrontInvalidate.distributionIdKey)}`);

    // get the id from the output of stack.
    const stackName = this.serverless.getProvider('aws').naming.getStackName()

    return this.aws.request('CloudFormation', 'describeStacks',{ StackName: stackName })
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
      .then(() => this.createInvalidation(distributionId, reference))
      .catch(error => {
        cli.consoleLog('Failed to get DistributionId from stack output. Please check your serverless template.');
        return;
      });
  }
}

module.exports = CloudfrontInvalidate;
