# Myplanet Digital - Content Downloader
#
# Downloads all the content from the Myplanet Digital content repository.
#
# Usage:
#	npm install
#	npm install grunt -g
#	grunt content
#
module.exports = (grunt) ->
	grunt.initConfig
		# Retrieve any information from package.json.
		pkg: grunt.file.readJSON("package.json")

		# Clone the content repository.
		gitclone:
			content:
				options:
					repository: 'https://github.com/myplanetdigital/myplanetdigital-content.git'
					directory: 'build/content'

		# Copy the content into th source directory.
		copy:
			content:
				files: [
					{
						expand: true
						cwd: 'build/content/'
						src: '**'
						dest: 'src/'
					}
				]

		# Remove any built files.
		clean:
			content: [
				'build'
				'src/.gitignore' # Don't need content's ignore file.
			]

		# Remove all local content from the content repository.
		gitclean:
			content:
				options:
					directories: true
					onlyignoredfiles: true
				files: [
					src: 'src'
				]

		sprite:
			options:
				algorithm: 'binary-tree'
			build:
				src: 'src/files/images/sprites/*.png'
				retinaSrcFilter: 'src/files/images/sprites/*-2x.png'
				retinaDest: 'src/files/images/spritesheet-2x.png'
				retinaImgPath: '../images/spritesheet-2x.png'
				dest: 'src/files/images/spritesheet.png'
				# cssTemplate: 'src/documents/spritesmith-less.template.mustache'
				destCss: 'src/documents/styles/generated/sprites.less'
				imgPath: '../images/spritesheet.png'
				padding: 10

	# @todo Add S3 deploy

	grunt.loadNpmTasks 'grunt-git'
	grunt.loadNpmTasks 'grunt-contrib-copy'
	grunt.loadNpmTasks 'grunt-contrib-clean'
	grunt.loadNpmTasks 'grunt-spritesmith'

	# Generate spritesheet
	grunt.registerTask 'sprites', ['sprite']

	# Clear the local changes, both from the build, and any git ignored files.
	grunt.registerTask 'clear', ['gitclean', 'clean']

	# Clear loal changes, clone the content repository, and move it in locally.
	grunt.registerTask 'content', ['clear', 'gitclone', 'copy', 'clean']

	# By default, simply install the content.
	grunt.registerTask 'default', ['content', 'sprites']

