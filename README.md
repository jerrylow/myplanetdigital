# Myplanet.com   

This badge may not represent reality because docpad cli tools don't return with correct exit codes on errors therefore the build does not break when it should.
[![Build Status](https://travis-ci.org/myplanetdigital/myplanetdigital.svg?branch=develop)](https://travis-ci.org/myplanetdigital/myplanetdigital)

## Local development and Node versions
Travis uses [nvm](https://github.com/creationix/nvm) and is set to use node `v0.10.38` and npm `0.23.3`. The most recent version of Node (as of 2015-04-13) is `v0.12.0` and running `npm install` will break if you are running the most recent version. Use [nvm](https://github.com/creationix/nvm) on your machine and run the following:

```shell
nvm install 0.10
node -v
```
 
Run `nvm --help` to see other commands.

## Development with Dummy Content 
	     
	npm install docpad -g  
	npm install
	docpad generate --env static
	run an http-server in the /out directory

## Development with Production Content

	npm install docpad grunt-cli -g
	npm install
	grunt
	docpad run --env static
 
This downloads the external content, so be sure to be selective with your `git add`-ing.

## Deploying to GitHub Pages (dev.myplanet.com)

Any check into this branch or to the [seperate content repository](https://github.com/myplanetdigital/myplanetdigital-content) will trigger a build in [Travis](https://travis-ci.org/) which will then automagically be deployed to http://dev.myplanet.com

## License 

Copyright © 2014 Myplanet Digital. All rights reserved.
 
 
