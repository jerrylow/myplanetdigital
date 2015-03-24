(function rotator() {
	if (!window.isSinglePageApp) {
		return;
	}

	var $window = $(window),
		rotators = [];

	function init($parent, $items, rotator, preInit, postInit) {
		var maxHeight = -1;
		preInit();
		$items.each(function(i, item) {
			var $item = $(item),
				height = $item.css('position', 'static').height();
			if(height > maxHeight) {
				maxHeight = height;
			}
			$item.css({
				position: 'absolute',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				opacity: i === rotator.curIndex ? 1 : 0
			});
		});
		$parent.css('height', maxHeight + 'px');
		postInit();
	}

	function resize() {
		var len = rotators.length;
		while(len--) {
			rotators[len].initFn();
		}
	}
	//wow, web font loading
	$window.on('deviceCapabilities', function () {
		window.setTimeout(resize, 3999);
	});
	$window.smartresize(resize);

	$window.on('deviceCapabilities filter articles-transition', function() {
		window.setTimeout(function () {
			var len = rotators.length, isHome;
			while(len--) {
				rotators[len].id = window[(isHome = window.isTileView && window.currentTag === 'home') ? 'setInterval' : 'clearInterval'](isHome ? function () {
					this.$items[this.curIndex].style.opacity = 0;
					this.$items[this.curIndex = (this.nextIndex = (this.curIndex + 1) % this.$items.length)].style.opacity = 1;
				}.bind(rotators[len]) : rotators[len].id, rotators[len].interval);
			}
		}, 0);
	});

	window.rotator = function($parent, selector, interval, preInit, postInit) {
		var me;
		if(($items = $parent.find(selector)).length) {
			rotators.push(me = {
				$items: $items,
				curIndex: 0,
				interval: interval || 4000,
				preInit: preInit = preInit || function () {},
				postInit: postInit || function () {}
			});
			(me.initFn = init.bind(null, $parent = $parent || $('body'), $items, me, preInit, postInit))();
		}
	};

}());
