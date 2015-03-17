(function menu () {

	'use strict';

	if (! window.isSinglePageApp) {
		return;
	}

	var $window = $(window),
		$body = $('body'),
		$wrap = $('#wrap'),
		$menu = $('#menu'),
		$banner = $('#banner'),
		$bannerText = $banner.find('.banner-text'),
		$menuGhost,
		curTag,
		$logo = $('#menu .home'),
		$viewport = $('#viewport'),
		MENU_COLOR = 'dark',
		INDICATOR_COLOR = 'light',
		menuShown = $menu.hasClass(MENU_COLOR),
		$back = $('a[data-attr="back"]'),
		$indicator = $('<span data-role="menu-indicator" class="' + ($menu.hasClass('light') ? 'dark' : '') + '"></span>'),
		$active = $menu.find('.active'),
		curScrollTop,
		mobileMenuIsTransitioning = false,
		isHidden = false,
		isLoaded = false,
		isFirst = true,
		SMALL_HEADER_HEIGHT = 87,
		MENU_HEIGHT_OFFSET = 25,
		scrollMenuOffset = menuShown ? -(SMALL_HEADER_HEIGHT / 2) : 0,
		articleMenuOffset = MENU_HEIGHT_OFFSET,
		HEADER_HEIGHT = 147,
		INDICATOR_WIDTH = 100,
		LOGO_WIDTH = 75,
		MENU_WIDTH = 250,
		LI_PADDING = 25;

	function updateOffsets() {
		$menu.find('li').each(function(i, li) {
			li._offset = $(li).offset();
			li._width = $(li).width();
		});
	}
	function setIndicator(item, transition, offset) {
		var indicatorOffset,
			indicatorScaleX,
			indicatorRotation = 0,
			indicatorOpacity,
			$item;
		if(!item) {
			item = $menu.find('.active')[0];
		}
		if(!item._offset) {
			updateOffsets();
		}
		if (($item = $(item)).hasClass('home')) {
			indicatorOffset = item._offset.left + LOGO_WIDTH;
			indicatorOpacity = 0.4;
			indicatorScaleX = 0.1;
		} else  {
			indicatorOffset = item._offset.left + LI_PADDING;
			indicatorScaleX = (item._width - (LI_PADDING * 2)) / 100;
			indicatorOpacity = 0.999;
		}
		// + item.offsetWidth / 2 - INDICATOR_WIDTH;
	//window.requestAnimationFrame(function() {
		$indicator.css({
			transform: 'translate3d(' + Math.round(indicatorOffset) + 'px, ' + Math.ceil(scrollMenuOffset + articleMenuOffset + (offset || 0)) + 'px, 0) rotate(' + indicatorRotation + 'deg) scaleX(' + indicatorScaleX + ') scaleY(1.5)',
			opacity: indicatorOpacity,
			transition: transition || ''
		});
	//});
	}

	//active an item in the menu
	function activateLink ($item) {
				scrollMenuOffset = 0;
				articleMenuOffset = 0;
		//window.requestAnimationFrame(function () {

			$menu.attr('data-active', curTag = $item.text().trim());
			$active.removeClass('active');
			$active = $item.addClass('active');
			if(window.responsiveState !== 'mobile') {
				handleScroll();
				setIndicator($item[0]);
			} else if(window.mobileMenuIsOpen) {
				window.setTimeout(closeMenu, window.isIOS ? 50 : 0);
			}
		//});
	}

	//setup the menu for desktop view
	function initDesktopMenu() {
		if(window.desktopCapable) {
			curScrollTop = window.pageYOffset;
			if(window.responsiveState !== 'mobile' && $active.length) {
				updateOffsets();
				window.requestAnimationFrame(function () {
					handleScroll();
					//setIndicator($active[0], window.isTileView ? '' : 'none');
				});
			}
		}
	}

	function initMobileMenu() {
		window.afterScrollFixOrientationChange = function() {
			$menu.css('height',  window.innerHeight + 2);
		};
		window.afterScrollFixOrientationChange();

		window.scrollFix({
			scrollable: [$menu[0]]
		});

		$window.on('touchstart', function(e) {
			if(mobileMenuIsTransitioning) {
				return;
			}
			if(window.mobileMenuIsOpen && e.originalEvent.touches[0].clientX < window.innerWidth - MENU_WIDTH) {
				closeMenu();
				return false;
			}
		});
		$window.on('resize', window.afterScrollFixOrientationChange);
	}

	function hideMenu(e, data, transition) {
		var transitionTime, headerHeight;
		if(window.responsiveState === 'mobile') {
			return;
		}
		transition = transition || 'transform 0.725s ease';
		headerHeight = menuShown ? (SMALL_HEADER_HEIGHT + 4) : HEADER_HEIGHT;

		$menu.css({
			transform: 'translate3d(0,' + (articleMenuOffset = -headerHeight) + 'px,0)',
			transition: transition
		});
		if(MENU_COLOR === 'dark') {
			$back.removeClass('light');
		}
		curScrollTop = data ? data.top : window.pageYOffset;
		setIndicator(null, transition, e ? 0 : MENU_HEIGHT_OFFSET);
		isHidden = true;
	}

	function showMenu(beforeTileTransition, data, transition) {
		if(window.responsiveState === 'mobile' || !isHidden) {
			return;
		}

		transition = transition || 'transform 0.725s ease'
		$menu.css({
			transform: 'translate3d(0,0,0)',
			transition: transition
		});
		if($menu.hasClass('dark')) {
			$back.addClass('light');
		}
		curScrollTop = data ? data.top : window.pageYOffset;
		articleMenuOffset = MENU_HEIGHT_OFFSET;
		if(beforeTileTransition && !shouldShowMenu(curScrollTop)) {
			$menu.removeClass(MENU_COLOR).addClass('no-transition');
			articleMenuOffset = -SMALL_HEADER_HEIGHT;
			scrollMenuOffset = 0;
			setIndicator(null, 'none');
			window.setTimeout(function () {
				articleMenuOffset = 0;
				setIndicator(null, transition);
			}, 0);
			window.setTimeout(function () {
				$menu.removeClass('no-transition');
			}, 425);
		} else {
			setIndicator(null, transition);
		}
		isHidden = false;
	}

	function closeMenu(immediate) {
		if(!mobileMenuIsTransitioning  && window.mobileMenuIsOpen) {
			mobileMenuIsTransitioning = true;
			//window.location.hash = '';
			window.requestAnimationFrame(function() {
				window.mobileMenuIsOpen = false;
				$body.removeClass('menu');
			});
		}
	}

	function openMenu(dontPushState) {
		if(!mobileMenuIsTransitioning  && !window.mobileMenuIsOpen) {
			if(window.hasTouchEvents) {
				window.afterScrollFixOrientationChange();
			}
			mobileMenuIsTransitioning = true;
			window.mobileMenuIsOpen = true;
			window.mobileMenuYOffset = window.curScrollTop = window.pageYOffset;

			$window.trigger('menu');

			window.setTimeout(window.requestAnimationFrame.bind(null, function () {
				$viewport.css({
					transform:'translateZ(0)',
					transition: 'none'
				});
				window.setTimeout(function() {
					window.requestAnimationFrame(function() {
						$viewport.css({
							transform:'',
							transition: ''
						});
						$body.addClass('menu');
					});
				}, 0);
			}), 0);
		} else if(window.desktopCapable) {
			closeMenu();
		}
	}

	function shouldShowMenu(top) {
		return top >= (curTag === 'Home' ? 433 : 393);
	}

	function handleScroll (e, data, transition) {
		var wasMenuShown;
		if(data && (!isLoaded || window.isBusy || window.isElevating || data.isFinalEvent || window.responsiveState === 'mobile'))  {
			return;
		}
		if(!window.isTileView) {
			/*if(data && (data.top < curScrollTop)) {
				showMenu(null, null, transition || 'transform 0.425s');
			} else if(data && data.top > 0) {
				hideMenu(null, null, transition || 'transform 0.425s');
			}*/
			isFirst  = false;
			return curScrollTop = data ? data.top : window.pageYOffset;
		}
		articleMenuOffset = 0;

		data = data || {top: window.pageYOffset};
		wasMenuShown = menuShown;
		if(menuShown = shouldShowMenu(data.top)) {
			if(!wasMenuShown || isFirst) {
				$menu.addClass(MENU_COLOR).addClass('delay').css('transition', transition || '');
				$indicator.addClass(INDICATOR_COLOR);
				scrollMenuOffset = -((SMALL_HEADER_HEIGHT / 2) - 27) - 2;
				setIndicator(null, 'transform .4s ease .25s');
			}
		} else {
			if(wasMenuShown || isFirst) {
				$menu.removeClass(MENU_COLOR).removeClass('delay').css('transition', transition || '');
				$indicator.removeClass(INDICATOR_COLOR);
				scrollMenuOffset = 0;
				if(!isHidden) {
					setIndicator();
				}
			}
			if(window.isTileView) {
				$bannerText.css({
					transform: 'translate3d(0,' + Math.round(-data.top / 3) + 'px, 0)',
					opacity: Math.max(0.01, Math.min(0.999, 1 - (data.top/419))).toFixed(3),
					transition: 'none'
				});
			}
		}
		isFirst = false;
		curScrollTop = data.top;
	}

	//handle the mobile menu toggle button being pressed
	$('#menu-toggle').on('click', openMenu);

	//after the menu has finished its toggling transition
	$menu.parent().on('transitionend webkitTransitionEnd', function (e) {
		if (!mobileMenuIsTransitioning || e.target !== $menu[0]) {
			return;
		}
		if(window.responsiveState === 'mobile') {
			if(window.isWebkitMobileNotIOS) {
				//window.requestAnimationFrame(function () {
					$wrap.css({
						position: window.mobileMenuIsOpen ? 'fixed' : '',
						top: window.mobileMenuIsOpen ? -mobileMenuYOffset : ''
					});
					if(!window.justClosedMenu) {
						if(!window.mobileMenuIsOpen) {
							window.scroll(0, window.mobileMenuYOffset);
						}
					}
					window.justClosedMenu = false;
				//});
			} else if(window.hasTouchEvents) {
				$menu.css({
					top: window.mobileMenuIsOpen ? 0 : ''
				});
			}
			mobileMenuIsTransitioning = false;
		}
	});

	//only attach desktop events if the device is capable of showing desktop
	$window.on('deviceCapabilities', function (e, data) {
		var t, initialT, removeHover;
		if(data.desktopCapable) {
			$window.on('pageScroll', handleScroll);
			//$body.on('mousemove', handleMouseMove);
			$wrap.append($indicator);
			$window.smartresize(function(){
            	updateOffsets();
                setIndicator($active[0]);
            });
			$menu.on('mouseleave', 'li', function() {
				if(window.responsiveState === 'mobile') {
					return;
				}
				var $el = $(this);
				if($el.hasClass('community') || $el.hasClass('design') || $el.hasClass('technology')) {
					$menu.removeClass('community').removeClass('design').removeClass('technology');
					$el = $el.siblings().filter('.blog');
				}
				if($el.hasClass('home')) {
					$el.removeClass('hover');
					return $el.addClass('no-delay').one('transitionend webkitTransitionEnd', function () {
						$el.removeClass('no-delay');
					});
				}

				t = window.setTimeout(removeHover = function () {
					$el.removeClass('hover');
					setIndicator();
					t = null;
					removeHover = null;
				}, 300);
			});
			$('#menu').on('mouseenter', 'li', function(e) {
				if(window.responsiveState === 'mobile') {
					return;
				}
				var $me = $(this);
				$me.addClass('hover');
				if(t) {
					window.clearTimeout(t);
					t = null;
					$me.siblings().removeClass('hover');
				}
				setIndicator(this);
			});
			$([$menu[0], $back[0]]).on('mouseenter', function(e) {
				if(window.responsiveState === 'mobile') {
					return;
				}
				if(!window.isTileView) {
					showMenu(null, null, 'transform 0.4s');
				}
				if(e.target === $back[0]) {
					$(e.target).closest('#back').addClass('hover');
				}
				window.clearTimeout(initialT);
			}).on('mouseleave', function(e) {
				if(window.responsiveState === 'mobile') {
					return;
				}
				if(!window.isTileView && e.clientY > 0 && e.relatedTarget !== $back[0]) {
					hideMenu(null, null, 'transform 0.4s');
					if(removeHover) {
						removeHover();
					}
				}
				if(e.target === $back[0]) {
					$(e.target).closest('#back').removeClass('hover');
				}
			});
			window.setTimeout(function () {
				isLoaded = true;
				if(!window.isTileView) {
					initialT = window.setTimeout(hideMenu, 750);
				}
			}, 500);

			$(window).on('load', initDesktopMenu);
		} else if (data.hasTouchEvents) {
			$(initMobileMenu);
		}

		if($active.length) {
			$menu.attr('data-active', curTag = $active.text().trim());
		}
	});

	//$wrap.append($menuGhost);
	$wrap.append($menuGhost = $('<div data-role="menu-ghost" class="menu-ghost"></div>'));

	$menuGhost.on('click', function(e) {
		if(window.responsiveState === 'mobile' && this === e.target) {
			$window.trigger('scroll-top');
		}
	});

	//handle menu view changes when the users resizes the window
	$window.on('responsiveStateChange', function (e, data) {
		window.requestAnimationFrame(function() {
			if(data.oldState === 'mobile') {
				initDesktopMenu();
				if(window.isTileView) {
					handleScroll();
				} else {
					$menu.addClass(MENU_COLOR);
					hideMenu();
				}
			} else {
				$bannerText.css({
					transform: '',
					opacity: '',
					transition: ''
				});
				$menu.css({
					transform:'',
					transition: ''
				});
			}
		});
	});
	window.mobileMenuIsOpen = false;

	$window.on('same-page same-filter elevator-done',  function () {
		if(window.responsiveState === 'mobile') {
			closeMenu();
		}
	});

	$window.on('same-filter', function () {
		if(window.responsiveState !== 'mobile') {
			handleScroll(null, null, 'transform 0.725s ease');
		}
	});

	$window.on('filter',function (e, tag) {
		activateLink($menu.find('li.' + tag));
	});
	$window.on('article-to-article', function (e, tag) {
		activateLink($menu.find('li.' + tag));
	});

	$window.on('article-transition-done', function () {
		if(window.responsiveState !== 'mobile') {
			menuShown = true;
			$menu.addClass(MENU_COLOR).addClass('no-transition');
			$indicator.addClass(INDICATOR_COLOR);
			scrollMenuOffset = -SMALL_HEADER_HEIGHT / 2;
			hideMenu(null, null);
			window.setTimeout(function () {
				$menu.removeClass('no-transition');
				$back.removeClass('no-transition');
			}, 0);
		}
	});


	$window.on('article-transition', hideMenu);
	$window.on('tiles-transition', function (e) {
		showMenu(true);
	});
}());