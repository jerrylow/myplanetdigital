# Myplanet.com   

This badge may not represent reality because docpad cli tools don't return with correct exit codes on errors therefore the build does not break when it should.
[![Build Status](https://travis-ci.org/myplanetdigital/myplanetdigital.svg?branch=develop)](https://travis-ci.org/myplanetdigital/myplanetdigital)

## Cloning the Repo

Use the `--recursive` switch when cloning this repo for the first time.

For an already cloned repo, or an older Git version, just do:

```
cd myplanetdigital-content
git submodule update --init --recursive
```

## Some Prep

Create the following symbolic links:

Under src/documents:

```
ln -s ../../myplanetdigital-content/documents/article article
ln -s ../../myplanetdigital-content/documents/index.html.md index.html.md
ln -s ../../myplanetdigital-content/documents/tags tags
```

Under src/files:

```
ln -s ../../myplanetdigital-content/files/associated-files associated-files
ln -s ../../myplanetdigital-content/files/images images
```

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

Copyright © 2014-2015 Myplanet. All rights reserved.
 
 
