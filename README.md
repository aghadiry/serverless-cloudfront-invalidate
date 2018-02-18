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

```yaml
custom:
  cloudfrontInvalidate:
    distributionId: 'CLOUDFRONT_DIST_ID' # reqired
    items: # one or more paths required
      - '/index.html'
```

## Usage

Run `sls deploy`. After the deployment a Cloudfront Invalidation will be started.
Run `sls cloudfrontInvalidate` to do a standalone invalidation