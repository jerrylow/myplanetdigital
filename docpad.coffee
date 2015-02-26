module.exports =
	# Experimentally figured out that 4 is warnings and more severe
	# logLevel: (if ('-d' in process.argv) then 7 else 4)
 
	port: 8080

	env: 'static'
 
	templateData:
		site:
			title: 'Myplanet'
			url: ''
			styles: [
				'/styles/main.css'
			]
			# The order of these matters big time!!!
			scripts: [
				'/scripts/pollyfill.js'
				'/scripts/vendor/scrollfix.js'
				'/scripts/vendor/jquery.flexslider-min.js'
				'/scripts/modules/menu.js'
				'/scripts/modules/tiles.js'
				'/scripts/modules/elevator.js'
				'/scripts/modules/banner.js'
				'/scripts/main.js'
				'/scripts/vendor/fastclick.js'
				'/scripts/vendor/history.min.js'
				'/scripts/init.js'
				'/scripts/vendor/prism.js'
			]
			'ie8styles': [
				'/styles/site-ie8.css'
			]
			'ie7styles': [
				'/styles/site-ie7.css'
			]
			'jquery1': [
				'/scripts/vendor/jquery-1.11.0.min.js'
			]
			'jquery2': [
				'/scripts/vendor/jquery-2.1.0.min.js'
			]
			'html5shiv': [
				'/scripts/vendor/html5shiv.js'
			]
			'main-ie8' : [
				'/scripts/main-ie8.js'
			]
			'menu-ie8' : [
				'/scripts/menu-ie8.js'
			]
			'isotope' : [
				'/scripts/vendor/isotope-beta2.pkgd.min.js'
			]
			'tiles-immediate' : [
				'/scripts/modules/tiles-immediate.js'
			]

			# Social Media Services
			services:
				googleAnalytics: 'UA-16401713-3'
				disqus: 'myplanetsite'

			# Override getUrl to fetch relevant url for environment
			getUrl: (document) ->
				return (document.url or document.get?('url'))

	# Set up collections to query and sort documents.
	collections:
		# The homepage collection to bring up all content, ordered by date.
		homepage: (database) ->
			options =
				relativeOutDirPath:
					$in: [
						'article'
						'careers'
						'work'
						'privacy'
					]
				ignored: $ne: true
				layout:
					$nin: ['content']
			return database.findAllLive(options, [{sticky: -1, date: -1}]).on "add", (model) ->
				model.setMetaDefaults({sticky: false})

		# Rendered content into individual segmented HTML pages.
		content: (database) ->
			database.findAllLive(
				relativeOutDirPath: $in: ['work', 'article', 'careers', 'privacy']
				ignored: $ne: true
			).on "add", (model) ->
				model.setMetaDefaults({additionalLayouts: ['content']})

		# Navigation menu.
		menu: (database) ->
			database.findAllLive
				menu:
					$gt: 0
				layout:
					$nin: ['content', 'content-tiles']
				, {menuOrder: 1}

	plugins:
		#Feedr, for job postings
	    feedr:
	        feeds:
	            jobs:
	                url: 'http://hire.jobvite.com/CompanyJobs/Xml.aspx?k=JobListing&c=qYT9VfwF&v=1'

		# Navlinks plugin:
		# https://github.com/lucor/docpad-plugin-navlinks
		navlinks:
			collections:
				homepage: 1

		# Formatting for the dates
		moment:
			formats: [
				{
					formatted: 'dateMedium'
					format: 'MMMM Do YYYY'
					raw: 'date'
				}
				{
					formatted: 'dateLong'
					format: 'dddd, MMM DD, YYYY'
					raw: 'date'
				}
			]

		associatedfiles:
			useRelativeBase: true

		cleanurls:
			static: true

	# Environmental variables
	environments:
		development:
			templateData:
				site:
					# Set url on dev environment to be root
					url: ''
					# Disable certain services on the development environment.
					services:
						googleAnalytics: false
