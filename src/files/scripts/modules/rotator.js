(function rotator() {
	'use strict';

	if (!window.isSinglePageApp) {
		return;
	}
	var rotators = [];

	function hideShow(hide, show, rotator) {
		if(hide !== show) {
			show.style.opacity = 1;
			hide.style.opacity = 0;
			show.style.pointerEvents = 'auto';
			hide.style.pointerEvents = 'none';
			rotator.$nav.find('> li[data-index="' + $(show).index() + '"]').addClass('active').siblings().removeClass('active');
		}
	}

	function updateRotatorTimer(rotator) {
		rotator.id = window[rotator.run() ? 'setInterval' : 'clearInterval'](rotator.run() ? function () {
			if(rotator.run()) {
				hideShow(this.$items[this.curIndex], this.$items[this.curIndex = (this.curIndex + 1) % this.$items.length], rotator);
			}
		}.bind(rotator) : rotator.id, rotator.interval);
	}

	function updateRotatorTimers() {
		var len = rotators.length;
		while(len--) {
			updateRotatorTimer(rotators[len]);
		}
	}

	function initRotator(rotator, addNav) {
		var maxHeight = -1;
		rotator.preInit();
		if(addNav = addNav && rotator.$items.length > 1) {
			rotator.$nav = $('<ul class="rotator-nav"><li data-index="prev"></li></ul>');
		}
		rotator.$items.each(function(i, item) {
			var $item = $(item);
			$item[0]._height = $item.css('position', 'static').height();
			if($item[0]._height > maxHeight) {
				maxHeight = $item[0]._height;
			}
			if(addNav) {
				rotator.$nav.append($('<li ' + (!i ? 'class="active"' : '') + ' data-index="' + i + '"></li>'));
			}
		});
		rotator.$items.each(function(i, item) {
			var $item = $(item);
			$item.css({
				position: 'absolute',
				top: (maxHeight - item._height) / 2,
				left: 0,
				right: 0,
				bottom: maxHeight - item._height,
				opacity: i === rotator.curIndex ? 1 : 0
			});
		});
		rotator.$parent.css('height', maxHeight + 'px');
		if(addNav) {
			rotator.$nav.append($('<li data-index="next"></li>'))
			rotator.$parent.append(rotator.$nav);
			rotator.$nav.on('click', 'li', function () {
				var attr = this.getAttribute('data-index');
				window.clearInterval(rotator.id);
				hideShow(rotator.$items[rotator.curIndex], rotator.$items[rotator.curIndex = (attr === 'next' ? rotator.curIndex + 1 : (attr === 'prev' ? (rotator.curIndex === 0 ? rotator.$items.length -1 : rotator.curIndex - 1) : window.parseInt(attr, 10))) % rotator.$items.length], rotator);
				updateRotatorTimer(rotator);
			});
		}
		rotator.postInit();
		return rotator;
	}

	function resize() {
		var len = rotators.length;
		while(len--) {
			initRotator(rotators[len]);
		}
	}

	(function init() {
		var $window = $(window);

		//wow, web font loading
		$window.on('deviceCapabilities', function () {
			window.setTimeout(resize, 500);
			window.setTimeout(resize, 3000);
		});
		$window.smartresize(resize);
		$window.on('deviceCapabilities filter articles-transition', updateRotatorTimers);

		window.rotator = function($parent, selector, interval, showNav, run, preInit, postInit) {
			var me, $items;
			if(($items = $parent.find(selector)).length) {
				rotators.push(initRotator({
					$parent: $parent || $('body'),
					$items: $items,
					curIndex: 0,
					interval: interval || 4000,
					run: run || function () { return true; },
					preInit: preInit = preInit || function () {},
					postInit: postInit || function () {}
				}, showNav));
				$items.css('pointer-events', 'none')[0].style.pointerEvents = 'auto';
			}
		};
	}());

}());