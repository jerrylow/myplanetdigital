(function tiles () {

	'use strict';
	if (! window.isSinglePageApp) {
		return;
	}

	var $window = $(window),
		$wrap = $('#main .main-wrap'),
		$menu = $('#menu'),
		topOffset = 0,//parseInt($wrap.css('margin-top').replace(/px/, ''), 10),
		scrollData,
		firstEventTimeout = null,
		throttleTimeout = null,
		flushingTimeout = null,
		hasHiddenTiles = true,
		queue = [],
		layerQueue = [],
		finishFlush,
		$hiddenTiles,
		IS_CHROME = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

	function initializePage() {
		if(!window.isTileView) {
			return;
		}

		$hiddenTiles = window.tiles.items.filter(function (tile) {
			if(true || !IS_CHROME || window.isWebkitMobileNotIOS || (tile.position.y + topOffset < (window.pageYOffset + window.pageHeight))) {
				tile.element.style.opacity = '1';
				$(tile.element).addClass('revealed');
				return false;
			} else {
				$(tile.element).addClass('hidden');
			}
			return true;
		}).sort(function (a, b) {
			if(b.position.y === a.position.y) {
				return a.position.x - b.position.x;
			}
			return b.position.y - a.position.y;
		});

		hasHiddenTiles = $hiddenTiles.length;
		firstEventTimeout = null;
	}

	function removeLayer(item) {
		item.classList.remove('reveal');
		item.classList.remove('show');
		item.classList.remove('hidden');
		item.classList.add('revealed');
		item.style.opacity = '1';
	}

	function removeLayers() {
		var len = layerQueue.length,
			item;
		while(len--){
			removeLayer(layerQueue[len]);
			layerQueue.splice(len, 1);
		}
	}

	function removeAllLayers() {
		if(!$hiddenTiles) {
			return;
		}
		var len = $hiddenTiles.length;
		while(len--){
			removeLayer($hiddenTiles[len].element);
		}
		$hiddenTiles = [];
		len = queue.length;
		while(len--){
			removeLayer(queue[len]);
		}
		queue = [];
		len = layerQueue.length;
		while(len--){
			removeLayer(layerQueue[len]);
		}
		layerQueue = [];
	}

	function flushQueue() {
		var len = queue.length,
			item,
			count = 0;

		while(len--) {
			item = queue[len];
			item.tile.classList.add(queue[len].klass);
			queue.splice(len, 1);
			if(++count === 2 && queue.length) {
				return flushingTimeout = window.setTimeout(finishFlush, 50);
			}
		}
		if(queue.length) {
			return flushingTimeout = window.setTimeout(finishFlush, 50);
		}
		flushingTimeout = null;
	}

	finishFlush = window.requestAnimationFrame.bind(null, flushQueue);

	function onScroll() {
		if(!$hiddenTiles) {
			return;
		}
		var tile,
			len = $hiddenTiles.length,
			added = false;
		hasHiddenTiles = len;

		while(len--) {
			tile = $hiddenTiles[len];
			if(tile.position.y + topOffset < scrollData.bottom) {
				if (tile.position.y > scrollData.top) {
					if(!firstEventTimeout) {
						queue.unshift({tile: tile.element, klass: 'reveal'});
						added = true;
					}
				} else {
					queue.unshift({tile: tile.element, klass: 'show'});
					added = true;
				}
				$hiddenTiles.splice(len, 1);
			}
		}

		if(added && !flushingTimeout) {
			window.setTimeout(function () {
				window.requestAnimationFrame(flushQueue);
			}, 0);
		}
		throttleTimeout = null;
	}

	function handleScroll(e, data) {
		if(data.isFinalEvent) {
			scrollData = data;
			return onScroll();
		}
		if(!hasHiddenTiles || throttleTimeout) {
			return;
		}
		if(firstEventTimeout) {
			return scrollData = data;
		}

		scrollData = data;
		throttleTimeout = setTimeout(onScroll, 125);
	}

	function transitionEnd (e) {
		if(!e.target.classList.contains('tile')) {
			return;
		}

		//initial fade in
		if (!e.target.classList.contains('show') && !e.target.classList.contains('reveal')) {
			return removeLayer(e.target);
		}

		//remove the layer after scrolling
		//if(! window.isScrolling) {
		//	window.requestAnimationFrame(removeLayer.bind(null, e.target));
		//} else {
			layerQueue.push(e.target);
		//}
	}

	//only attach events if the device is capable of showing desktop
	$window.on('deviceCapabilities', function (e, data) {
		if(data.desktopCapable || !data.hasTouchEvents) {
			//$window.on('pageScroll', handleScroll);
			//$window.on('after-scrolling', window.requestAnimationFrame.bind(null, removeLayers));
			//$wrap.on('transitionend webkitTransitionEnd', transitionEnd);
			//$window.on('article menu', removeAllLayers);
			scrollData = data;
		}

		firstEventTimeout = window.setTimeout(initializePage, 350);
	});

	$window.on('filter', function(e, tag, immediate, scroll) {
		//window.setTimeout(function() {
			var toAnimate = [];
			if(window.responsiveState === 'mobile' && window.mobileMenuIsOpen) {
				return window.scroll(0, window.curScrollTop = 0);
			}
			immediate = true;
			//window.requestAnimationFrame(function () {
				window.tiles.items.map(function (tile) {
					var $tile = $(tile.element).removeClass('reveal revealed show hidden').css({
						opacity: immediate ? 1 : 0.01,
						transition: 'none'
					});
					if(!immediate) {
						toAnimate.push($tile);
					}
				});
				if(toAnimate.length) {
					window.setTimeout(function () {
						window.scroll(0, window.curScrollTop = 0);
						//window.setTimeout(function () {
						window.requestAnimationFrame(function () {
							var len = toAnimate.length;
							while(len--) {
								toAnimate[len].css({
									opacity: toAnimate[len][0].style.display === 'none' ? '1' : '1',
									transition: ''
								});
							}
						});
						//}, 0);
					}, 0);
				} else if(!window.isIOS) {
					window.scroll(0, window.curScrollTop = 0);
				}
			//});
		//}, 0);
	});

	$window.on('same-page', function() {
		if(window.responsiveState !== 'mobile' || !window.mobileMenuIsOpen) {
			$window.trigger('scroll-top');
		}
	});

	$window.on('tiles-init', function () {
		window.initializeTiles();
		initializePage();
	});

}());