(function elevator () {
	'use strict';

	if (!window.isSinglePageApp) {
		return;
	}
	var $window = $(window),
		RAF_OFFSET = 16;

	function easeInOutQuad(t, b, c, d) {
		t /= d/2;
		if (t < 1) return c/2*t*t + b;
		t--;
		return -c/2 * (t*(t-2) - 1) + b;
	}
	function scrollTo(to) {
		var start = window.curScrollTop,
			change = to - start,
			duration = Math.round(Math.min(Math.abs(change * 1.25), window.responsiveState === 'mobile' ? 500 : 650)),
			currentTime = 0,
			last = new Date(),
			val;
		function scrollStep () {
			window.scrollTo(0, window.curScrollTop = val);
			if((currentTime < duration)) {
				window.setTimeout(animateScroll, 0);
			} else {
				window.scrollTo(0, to);
				$window.trigger('elevator-done');
			}
		}
		function animateScroll(){
			var now = new Date();
			val = easeInOutQuad(currentTime += now - last, start, change, duration);
			last = now;
			window.requestAnimationFrame(scrollStep);
		}

		animateScroll();
	}

	$window.on('scroll-top', function() {
		return scrollTo(0);
	});

	$window.on('scroll-to', function(e, newTop) {
		return scrollTo(newTop);
	});

}());
