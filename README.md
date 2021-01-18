# serverless-cloudfront-invalidate

Serverless plugin that allows you to invalidate Cloudfront Cache

## Install

Run `npm install` in your Serverless project.

```sh
$ npm install --save serverless-cloudfront-invalidate
```

## Setup

Add the plugin to your serverless.yml file as the last plugin

```yaml
plugins:
  - serverless-cloudfront-invalidate # add as the last plugin
```

If the CDN is created as part of same serverless.yml then you can specify the `distributionIdKey` and output the DomainId (as shown in the sample below).

```yaml
custom:
  cloudfrontInvalidate:
    - distributionId: "CLOUDFRONT_DIST_ID" #conditional, distributionId or distributionIdKey is required.
      distributionIdKey: "CDNDistributionId" #conditional, distributionId or distributionIdKey is required.
      autoInvalidate: true # Can be set to false to avoid automatic invalidation after the deployment. Useful if you want to manually trigger the invalidation later. Defaults to true.
      items: # one or more paths required
        - "/index.html"
      stage: "dev"  # conditional, the stage that this cloudfront invalidation should be created
            # this should match the provider's stage you declared, e.g. "dev" but not "prod" in this case
            # an invalidation for this distribution will be created when executing `sls deploy --stage dev`
    - distributionId: "CLOUDFRONT_DIST_ID" #conditional, distributionId or distributionIdKey is required.
      distributionIdKey: "CDNDistributionId" #conditional, distributionId or distributionIdKey is required.
      items: # one or more paths required
        - "/index.html"
      # `stage` is omitted, an invalidation will be created for this distribution at all stages
resources:
  Resources:
    CDN:
      Type: "AWS::CloudFront::Distribution"
      Properties: ....
  Outputs:
    CDNDistributionId:
      Description: CDN distribution id.
      Value:
        Ref: CDN
```

## Usage

Run `sls deploy`. After the deployment a Cloudfront Invalidation will be started.
Run `sls cloudfrontInvalidate` to do a standalone invalidation

### Options

The following options are supported:

##### cacert

Used to specify a cacert file for the AWS commands. This is useful for self signed certificates. You will need to specify the self signed cert in 2 places, one for the serverless execution and one for the AWS execution.

- Use `export cafile=<path to cert file>` to use self signed cert for serverless execution
- Run `sls cloudfrontInvalidate --cacert=<path to ca cert file>` to use self signed cert for AWS execution

##### Proxy

You can communicate with AWS even if you are using a proxy by setting the proxy to the environment variable of the execution environment.

- Correspond to the following environment variable names

  - proxy
  - HTTP_PROXY
  - http_proxy
  - HTTPS_PROXY
  - https_proxy

- example

  windows: `set HTTP_PROXY=http://localhost:8080`

  mac: `export HTTP_PROXY=http://localhost:8080`
