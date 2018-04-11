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
If the CDN is created as part of same serverless.yml then you can specify the ```distributionIdKey``` and output the DomainId (as shown in the sample below).
```yaml
custom:
  cloudfrontInvalidate:
    distributionId: 'CLOUDFRONT_DIST_ID' #conditional, distributionId or distributionIdKey is required.
    distributionIdKey: 'CDNDistributionId' #conditional, distributionId or distributionIdKey is required.
    items: # one or more paths required
      - '/index.html'
resources:
  Resources:
    CDN:
      Type: "AWS::CloudFront::Distribution"
      Properties:
        ....
  Output:
    CDNDistributionId:
      Description: CDN distribution id.
      Value:
        Ref: CDN
```

## Usage

Run `sls deploy`. After the deployment a Cloudfront Invalidation will be started.
Run `sls cloudfrontInvalidate` to do a standalone invalidation