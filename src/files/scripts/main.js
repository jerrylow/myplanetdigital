(function main() {

    'use strict';

    if (!window.isSinglePageApp) {
        return;
    }

    var $window = $(window),
        $body = $('body'),
        $article = $('#article'),
        $back = $('#back'),
        $backlink = $('#back a'),
        $viewport = $('#viewport'),
        $articlein = $('#article-inner'),
        $wrap = $('#wrap'),
        $main = $('#main'),
        $banner = $('#banner'),
        $mainWrap = $('.main-wrap'),
        $loadgif = $('.loading-overlay'),
        $loadgiftiles = $('.loading-overlay-tiles'),
        $anchors = $('a'),
        $footer = $('#main .footer'),
        $articleFooter = $('#article .footer'),
        $landing = $('.landing-content'),
        $portfolio = $('#portfolio'),
        $ajaxer = null,
        popped = false,
        sliderInit = false,
        fromTiles = false,
        hasLoadedTiles,
        filterTag,
        isLoading = false,
        scrollTimeout,
        preScrollTimeout,
        articleScrollTop = 0,
        tileScrollTop = 0,
        initialHistoryState = window.history.state,
        RELATIVE_URL_REGEX = /^(?:\/\/|[^\/]+)*\//,
        pageUrl = '/' + document.location.href.replace(RELATIVE_URL_REGEX, ''),
        pageTitle,
        linkTag,
        lastArticleUrl = '',
        doArticleAjax,
        doTileAjax,
        isFirstArticleLoad = true,
        isTransitioning = false,
        isTransitionEnding = false,
        cancelTransition = false,
        pageLoaded = false,
        linkClickedTime = new Date(),
        wasLinkClick,
        aborted = false,
        chromePopStateTimeout,
        chromePopStateScrollTop = null,
        chromeUsedBackLink,
        EXTERNAL_URL_REGEX = /^([^:\/?#]+:)?(?:\/\/([^\/?#]*))?([^?#]+)?(\?[^#]*)?(#.*)?/,
        ARTICLE_REGEX = /^((?!tags).)*\/(article|work|careers|privacy)\//,
        TAG_REGEX = /\/tags\/(.*)?/,
        MAPS_REGEX = /http:\/\/maps\.google\.com/,
        COVER_SRC_REGEX = /url\(['"]?(.*\.\w+)['"]?\)/,
        IS_FIREFOX = navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
        IS_CHROME = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
        IS_IE = navigator.userAgent.toLowerCase().indexOf('trident') > -1,
        IS_SAFARI = !IS_CHROME && navigator.userAgent.toLowerCase().indexOf('safari') > -1,
        FULL_WIDTH = 1324,
        DESKTOP_WIDTH = 1174,
        END_SCROLL_THRESHOLD = 250,
        SPINNER_HEIGHT = 61,
        IOS_CHROME_HEIGHT = 70,
        PRE_SCROLL_THRESHOLD = 100,
        FOUROHFOUR_HTML = '<div class="article-404"><div class="article-404-text"><h1>This page does not exist</h1><h2><em><a href="/">Go home</a></em></h2></div></div>',
        FOOTER_SCROLLTO_OFFSET = 110,
        PORTFOLIO_SCROLLTO_OFFSET = 137;

    function setResponsiveState() {
        var width = $window.width(),
            old,
            state = width >= FULL_WIDTH ? 'full' : (width >= DESKTOP_WIDTH ? 'desktop' : 'mobile');

        window.pageHeight = $window.height();
        $body.css('min-height', window.pageHeight + 1);
        if (window.responsiveState === state) {
            return;
        }

        old = window.responsiveState;
        window.responsiveState = state;

        $window.trigger('responsiveStateChange', [{
            newState: state,
            oldState: old
        }]);
    }

    function finishStartScrolling() {
        window.isScrolling = true;
        $body.addClass('scrolling');
    }

    function startScrolling() {
        return finishStartScrolling();
        //window.setTimeout(function () {
        // window.requestAnimationFrame(finishStartScrolling);
        //  }, 0);
    }

    function finishEndScrolling() {
        window.isScrolling = false;
        $body.removeClass('scrolling');
    }

    function endScrolling() {
        window.requestAnimationFrame(finishEndScrolling);
        scrollTimeout = null;
        $window.trigger('after-scrolling');
    }

   function finishArticleLoad(data) {
        window.setTimeout(function() {
            if (!isFirstArticleLoad) {
                $articlein.removeClass('reveal revealed');
            }
            window.requestAnimationFrame(function() {
                var img, match, $frames;
                $articleFooter.show();
                isFirstArticleLoad = false;

                function finish() {
                    $articlein.html(data);
                    $frames = $articlein.find('iframe').hide();
                    window.setTimeout(function() {
                        isLoading = false;
                        $loadgif.hide();
                        $back.addClass('reveal');
                        $articlein.addClass('reveal');
                        $body.css('height', '');
                        $article.css('height', '');
                        window.setTimeout(function () {
                            $articlein.addClass('revealed');
                            $('.active-tile').removeClass('active-tile');
                            $frames.show();
                            window.onArticleLoad();
                        }, 1000);
                        window.isBusy = false;
                    }, 500);
                }
                if(match = data.match(/(\/images\/default-covers\/.\.jpg)/)) {
                    img = new Image();
                    img.src = match[1];
                    return img.onload = img.onerror = finish;
                }
                finish();
            });
        }, 0);
    }

    function removeTrailingSlash(url) {
        return url.replace(/(\/)+$/, '');
    }

    function loadViaAjax() {
        if (isTileView) {
            if ($mainWrap.find('.tile').length === 0) {
                isLoading = true;
                $ajaxer = $.get('/index-content-tiles/index.html', function(data) {
                    $ajaxer = null;
                    window.setTimeout(function() {
                        window.requestAnimationFrame(function() {
                            $mainWrap.html(data);
                            $window.trigger('tiles-init');
                            window.requestAnimationFrame(function() {
                                hasLoadedTiles = true;
                                isLoading = false;
                                $loadgiftiles.hide();
                                window.tiles.arrange({
                                    filter: '.' + filterTag
                                });
                                $window.trigger('filter', [filterTag]);
                                window.currentTag = filterTag;
                                if (isTransitioning || isTransitionEnding) {
                                    return;
                                }
                                $body.css('height', '');
                                $main.css('height', '');
                                window.setTimeout(function() {
                                    window.isBusy = false;
                                }, 100);
                            });
                        });
                    }, 100);
                });
            }
        } else {
            isLoading = true;
            $ajaxer = $.get(removeTrailingSlash(window.location.href) + '-content/index.html', function(data) {
                $ajaxer = null;
                window.setTimeout(function() {
                    var image = new Image(),
                        $loadedData = $(data).eq(0),
                        bgImg;
                    if ($loadedData.length && $loadedData[0].nodeType === 1 && (bgImg = $loadedData.css('background-image'))) {
                        image = new Image();
                        image.onload = image.onerror = finishArticleLoad.bind(null, data);
                        image.src = bgImg.match(COVER_SRC_REGEX)[1];
                    } else {
                        finishArticleLoad(data);
                    }
                }, 0);
                if (!fromTiles) {
                    var tag = $(data).closest('.article-body').attr('data-tag') || $(data).closest('.profile-body').attr('data-tag'),
                        href = tag === 'home' ? '/' : '/tags/' + tag;
                    $backlink.attr('href', href);
                    $window.trigger('article-to-article', [tag]);
                }
            }).fail(function() {
                if (!aborted) {
                    finishArticleLoad(FOUROHFOUR_HTML);
                }
            });
        }
        $body.removeClass('animating');
    }

    function hideLanding() {
        $landing.hide();
    }

    function showLanding() {
        $landing.show();
    }

    function abortAjax() {
        $ajaxer.abort();
        $body.removeClass('animating');
        $body.css({
            height: ''
        });
        isLoading = false;
        window.isBusy = false;
        if (window.isTileView) {
            window.currentTag = '';
            $main.css('height', '');
        } else {
            lastArticleUrl = '';
            $article.css('height', '');
        }
    }

    function handlePageChange() {
        if (!(wasLinkClick = new Date() - linkClickedTime < 300)) {
            pageUrl = '/' + document.location.href.replace(RELATIVE_URL_REGEX, '');
        }

        var isArticleUrl = pageUrl.match(ARTICLE_REGEX),
            isTagUrl = !isArticleUrl && pageUrl.match(TAG_REGEX),
            overridePopstateScrollmove,
            timeoutLen = 0,
            noTransition = false,
            doFilter = false,
            startTransition,
            finishTransition,
            wasCancelled,
            top;

        if (window.isIOS) {
            window.curScrollTop = window.pageYOffset;
        }

        if (aborted = $ajaxer) {
            abortAjax();
        }

        cancelTransition = isTransitionEnding;
        isTransitionEnding = false;

        overridePopstateScrollmove = !window.isIOS || window.isIOS8; //ios doesn't mess with the scrollbar during popstate
        top = window.curScrollTop;
        wasCancelled = cancelTransition || isTransitioning || aborted;

        filterTag = null;

        if (isTagUrl) {
            filterTag = isTagUrl[1];
            filterTag = removeTrailingSlash(filterTag);
        }
        if (pageUrl === '/') {
            filterTag = 'home';
        }

        if (isArticleUrl && window.isTileView) { // Going to article view from tile view
            window.isTileView = false;
            window.isBusy = true;
            fromTiles = true;

            if (!wasCancelled) {
                    tileScrollTop = top;
            }
            isTransitioning = true;

            doArticleAjax = lastArticleUrl !== pageUrl;
            lastArticleUrl = pageUrl;
            if (wasLinkClick || doArticleAjax) {
                articleScrollTop = 0;
            }

            $window.trigger('article');

            $article.css({
                transform: !overridePopstateScrollmove ? 'translate3d(0, ' + (top - articleScrollTop) + 'px, 0)' : '',
                transition: 'none',
                opacity:''
            });
            $main.css({
                transform: overridePopstateScrollmove ? 'translate3d(0, ' + -(top - articleScrollTop) + 'px, 0)' : (wasCancelled ? 'translate3d(0, ' + (top - tileScrollTop) + 'px, 0)' : ''),
                transition: 'none',
                opacity:''
            });
            $banner.css('opacity', '');
            $body.addClass('animating');
            $body.css('height', articleScrollTop + window.pageHeight + 100);
            if (overridePopstateScrollmove) {
                window.scroll(0, window.curScrollTop = articleScrollTop);
            }

            window.setTimeout(function() {
                if (overridePopstateScrollmove && IS_CHROME && !chromeUsedBackLink) {
                    window.scroll(0, window.curScrollTop = articleScrollTop);
                }
                startTransition = function() {
                    if (doArticleAjax) {
                        $articleFooter.hide();
                        $articlein.html('');
                        $article.css('height', window.pageHeight + (window.isIOS ? IOS_CHROME_HEIGHT : 1));
                        $loadgif.find('.loading-spinner').css('top', window.pageHeight / 2 - SPINNER_HEIGHT);
                        $loadgif.show();
                    } else if (window.responsiveState === 'mobile') {
                        $back.addClass('reveal');
                    }
                    $window.trigger('article-transition', [{
                        top: articleScrollTop
                    }]);
                    finishTransition = function() {
                        $main.css({
                            transform: overridePopstateScrollmove ? 'translate3d(-100%, ' + -(top - articleScrollTop) + 'px, 0)' : (wasCancelled ? 'translate3d(-100%, ' + (top - tileScrollTop) + 'px, 0)' : ''),
                            transition: ''
                        });
                        $article.css({
                            transform: !overridePopstateScrollmove ? 'translate3d(-100%, ' + (top - articleScrollTop) + 'px, 0)' : '',
                            transition: ''
                        });

                        $body.addClass('article');
                    };
                    if (IS_CHROME) {
                        return window.requestAnimationFrame(finishTransition);
                    }
                    finishTransition();
                };
                if (!IS_CHROME) {
                    return window.requestAnimationFrame(startTransition);
                }
                startTransition();
            }, timeoutLen);

        } else if (isArticleUrl && !window.isTileView) { // article view to article view transition
            window.isBusy = true;
            doArticleAjax = true;
            fromTiles = false;
            articleScrollTop = 0;
            lastArticleUrl = pageUrl;
            // window.setTimeout(function () {
            //   window.requestAnimationFrame(function () {
            //if(doArticleAjax) {
            $articlein.html('');
            $article.css('height', window.pageHeight + (window.isIOS ? IOS_CHROME_HEIGHT : 1));
            $back.removeClass('reveal');
            $loadgif.find('.loading-spinner').css('top', window.pageHeight / 2 - SPINNER_HEIGHT);
            $loadgif.show();
            window.setTimeout(function() {
                window.scroll(0, window.curScrollTop = articleScrollTop);
                window.requestAnimationFrame(loadViaAjax);
                $window.trigger('article-transition', [{
                    top: articleScrollTop
                }]);
            }, 0);
            //}
            // });
            // }, timeoutLen);

        } else if (!isArticleUrl && !window.isTileView) { // Article view back to tile view
            window.isTileView = true;
            window.isBusy = true;
            if (!wasCancelled) {
                 articleScrollTop = top;
            }
            isTransitioning = true;
            doTileAjax = !hasLoadedTiles;
            if (wasLinkClick || doTileAjax) {
                tileScrollTop = 0;
            }
            $window.trigger('tiles');
            $main.css({
                transform: !overridePopstateScrollmove ? 'translate3d(-100%, ' + (top - tileScrollTop) + 'px, 0)' : '',
                transition: 'none',
                opacity:''
            });
            $article.css({
                transform: overridePopstateScrollmove ? 'translate3d(-100%, ' + -(top - tileScrollTop) + 'px, 0)' : (wasCancelled ? 'translate3d(-100%, ' + (top - articleScrollTop) + 'px, 0)' : ''),
                transition: 'none',
                opacity:''
            });
            $banner.css('opacity', '');

            $body.addClass('animating');
            $body.css('height', tileScrollTop + window.pageHeight + 100);
            if (overridePopstateScrollmove) {
                window.scroll(0, window.curScrollTop = tileScrollTop);
            }
            window.setTimeout(function() {
                if (overridePopstateScrollmove && IS_CHROME && !chromeUsedBackLink) {
                    window.scroll(0, window.curScrollTop = tileScrollTop);
                }
                startTransition = function() {
                    if (doTileAjax) {
                        $main.css('height', window.pageHeight + (window.isIOS ? IOS_CHROME_HEIGHT : 0));
                        $loadgiftiles.find('.loading-spinner').css('top', window.pageHeight / 2 - SPINNER_HEIGHT);
                        $loadgiftiles.show();
                    } else if (doFilter) {
                        window.tiles.arrange({
                            filter: '.' + filterTag
                        });
                        $window.trigger('filter', [filterTag, !noTransition]);
                    }
                    $back.removeClass('reveal');
                    $window.trigger('tiles-transition', [{
                        top: tileScrollTop
                    }]);
                    finishTransition = function() {
                        $main.css({
                            transform: !overridePopstateScrollmove ? 'translate3d(0, ' + (top - tileScrollTop) + 'px, 0)' : '',
                            transition: noTransition ? 'none' : ''
                        });
                        $article.css({
                            transform: overridePopstateScrollmove ? 'translate3d(0, ' + -(top - tileScrollTop) + 'px, 0)' : (wasCancelled ? 'translate3d(0, ' + (top - articleScrollTop) + 'px, 0)' : ''),
                            transition: noTransition ? 'none' : ''
                        });
                        $banner.css('transition', '');

                        $body.removeClass('article');
                        if (noTransition) {
                            window.setTimeout(window.requestAnimationFrame.bind(null, function() {
                                handleTransitionEnd();
                            }), 0);
                        }
                    };
                    if (IS_CHROME) {
                        return window.requestAnimationFrame(finishTransition);
                    }
                    finishTransition();
                };
                if (!IS_CHROME) {
                    return window.requestAnimationFrame(startTransition);
                }
                startTransition();
            }, timeoutLen);

            if (window.responsiveState === 'mobile' && window.mobileMenuIsOpen) {
                noTransition = true;
            } else if (!hasLoadedTiles) {
                noTransition = false;
            }

            if (filterTag && hasLoadedTiles && window.currentTag !== filterTag) { //article to tile view on different tag
                doFilter = true;
                window.currentTag = filterTag;
            } else if (hasLoadedTiles) {
                $window.trigger('same-filter');
            }
            if (wasLinkClick && window.isWebkitMobileNotIOS) {
                window.justClosedMenu = true;
                window.scroll(0, 0);
                $wrap.css('top', 0);
            }
            if (filterTag === 'home') {
                showLanding();
                $mainWrap.hide();
            } else {
                hideLanding();
                $mainWrap.show();
            }

        } else if (filterTag && window.isTileView && window.currentTag !== filterTag) { //change tag on tile view
            //window.requestAnimationFrame(function () {
            if (filterTag === 'home') {
                showLanding();
                $mainWrap.hide();
            } else {
                hideLanding();
                $mainWrap.show();
            }
            $window.trigger('filter', [window.currentTag = filterTag]);
            window.tiles.arrange({
                filter: '.' + filterTag
            });
            tileScrollTop = 0;
            if(wasLinkClick) {
                window.scroll(0, 0);
            } else {
                window.requestAnimationFrame(function () {
                  window.scroll(0, 0);
                 });
            }
            if (window.isWebkitMobileNotIOS) {
                window.justClosedMenu = true;
                $wrap.css('top', 0);
            }
            //  }
            // });
        }
        chromePopStateScrollTop = null;
        chromePopStateTimeout = null;
        chromeUsedBackLink = false;
    }

    function cleanupTransition() {
        isTransitionEnding = false;
        if (cancelTransition && window.isTileView && doArticleAjax) {
            lastArticleUrl = '';
        } else if (cancelTransition && !window.isTileView && doTileAjax) {
            window.currentTag = null;
        }
        if (!cancelTransition) {
            $body.removeClass('animating').css('height', '');
        }
        cancelTransition = false;
    }

    function finishTransition() {
        if ((window.isTileView && doTileAjax) || (!window.isTileView && doArticleAjax)) {
            window.setTimeout(function() {
                isTransitionEnding = false;
                if (cancelTransition) {
                    return cleanupTransition();
                }
                window.requestAnimationFrame(loadViaAjax);
            }, 0);
        } else {
            //window.setTimeout(window.requestAnimationFrame.bind(null, function () {
            cleanupTransition();
            window.isBusy = false;
            if (!window.isTileView && !doArticleAjax) {
                window.setTimeout(function() {
                    $back.addClass('reveal');
                    $('.active-tile').removeClass('active-tile');
                }, 100);
            }
            // }), 0);
        }
    }

    function isExternalUrl(url) {
        var match = url.match(EXTERNAL_URL_REGEX);
        if (typeof match[1] === 'string' && match[1].length > 0 && match[1].toLowerCase() !== location.protocol) {
            return true;
        }
        if (typeof match[2] === 'string' && match[2].length > 0 && match[2].replace(new RegExp(':(' + {
            'http:': 80,
            'https:': 443
        }[location.protocol] + ')?$'), '') !== location.host) {
            return true;
        }
        return false;
    }

    function handleTransitionEnd(e) {
        var startTransitionEnd,
            endTransition;
        if (!isTransitioning || (e && e.target !== $article[0])) {
            return;
        }

        isTransitionEnding = true;
        isTransitioning = false;

        if (!window.isTileView) {
            endTransition = function() {
                if (cancelTransition) {
                    return cleanupTransition();
                }
                hideLanding();
                $window.trigger('article-transition-done')
                window.scroll(0, window.curScrollTop = articleScrollTop + (window.isIOS && ! window.isIOS8 ? 0 : (window.pageYOffset - window.curScrollTop)));
                window.setTimeout(window.requestAnimationFrame.bind(null, function() {
                    if (cancelTransition) {
                        return cleanupTransition();
                    }
                    $loadgiftiles.hide();
                    if (!doArticleAjax) {
                        $back.addClass('reveal');
                    }
                    $article.css({
                        transition: '',
                        position: 'static',
                        marginLeft: '100%'
                    });
                    $main.css({
                        position: 'absolute',
                        opacity: 0.01
                    });
                    $banner.css('opacity', 0.01);

                    finishTransition();
                }), 0);
            };
        } else {
            endTransition = function() {
                if (cancelTransition) {
                    return cleanupTransition();
                }
                window.scroll(0, window.curScrollTop = tileScrollTop + (window.isIOS && ! window.isIOS8 ? 0 : (window.pageYOffset - window.curScrollTop)));

                window.setTimeout(window.requestAnimationFrame.bind(null, function() {
                    if (cancelTransition) {
                        return cleanupTransition();
                    }
                    //$loadgif.hide();
                    $main.css({
                        transition: '',
                        position: ''
                    });
                    $article.css({
                        position: 'absolute',
                        left: '100%',
                        marginLeft: '',
                        opacity: 0.01
                    });
                    finishTransition();
                }), 0);
            };
        }

        startTransitionEnd = function() {
            if (cancelTransition) {
                return cleanupTransition();
            }
            $article.css({
                transform: '',
                transition: 'none'
            });
            $main.css({
                transform: '',
                transition: 'none'
            });

            if (window.isIOS && !window.isIOS8) {
                return window.setTimeout(endTransition, 0);
            }
            endTransition();
        };
        if (window.isIOS  && !window.isIOS8) {
            return window.setTimeout(window.requestAnimationFrame.bind(null, startTransitionEnd), 0);
        }
        startTransitionEnd();
    }
    //init capabiliites
    setResponsiveState();
    $window.smartresize(setResponsiveState);

    window.curScrollTop = window.pageYOffset;
    window.isTileView = hasLoadedTiles = !$body.hasClass('article');
    window.isScrolling = false;
    window.currentTag = $('#menu').find('li.active').attr('class').split(' ')[0];

    window.rotator($('#testimonial'), '.client-quote', 6000, true, function () {
        return window.isTileView && window.currentTag === 'home' && (window.responsiveState !== 'mobile' || !window.mobileMenuIsOpen);
    }, showLanding, function () {
        if(!window.isTileView || window.currentTag !== 'home') {
            hideLanding();
        }
    });

    $window.trigger('deviceCapabilities', [{
        desktopCapable: window.desktopCapable = Math.max(screen.width, screen.height) >= DESKTOP_WIDTH,
        hasTouchEvents: window.hasTouchEvents = 'ontouchstart' in window,
        isIOS: window.isIOS = !!navigator.userAgent.match(/(iPad|iPhone|iPod)/g),
        isIOS8: window.isIOS8 = !!navigator.userAgent.match(/(iPhone|iPad|iPod)\sOS\s8/g),
        top: window.pageYOffset,
        bottom: window.pageYOffset + window.pageHeight
    }]);

    window.isWebkitMobileNotIOS = window.hasTouchEvents && !window.isIOS;

    SPINNER_HEIGHT = window.isIOS ? 25 : SPINNER_HEIGHT;
    pageUrl = pageUrl || '/';

    if (window.desktopCapable) {
        $body.addClass('desktop-capable');
        if (IS_SAFARI) {
            $body.addClass('safari');
        }
        if(IS_IE) {
            $body.addClass('ie');
        }
    } else if(window.isIOS) {
        $body.addClass('ios');
    }

    //handle geo urls
    if (window.hasTouchEvents) {
        $anchors.each(function() {
            var $link = $(this),
                href = $link.attr('href'),
                longLat = $link.attr('data-long-lat') || '43.65163,-79.37104';
            $link.attr('href', window.isIOS ? href.replace(MAPS_REGEX, 'http://maps.apple.com') : href.match(MAPS_REGEX) ? 'geo:' + longLat : href);
        });
    }

    //handle push/pop state
    $body.on('click', 'a', function(e) {
        var url = $(this).attr('href'),
            backFn,
            $link;
        if(!url) {
            return false;
        }
        if (!isExternalUrl(url)) {
            if (e.currentTarget.getAttribute('data-attr') === 'Contact Us') {
                if (window.responsiveState === 'mobile' && window.isWebkitMobileNotIOS) {
                    $wrap.css({
                        position: 'absolute'
                    });
                    // FOOTER_SCROLLTO_OFFSET = $('.menu-ghost').height();
                }
                $window.trigger('scroll-to', [window.mobileMenuYOffset = (window.isTileView ? $footer.offset().top - FOOTER_SCROLLTO_OFFSET : $articleFooter.offset().top - FOOTER_SCROLLTO_OFFSET)]);
            } /*else if (e.currentTarget.getAttribute('data-attr') === 'portfolio') {
                if (window.responsiveState === 'mobile' && window.isWebkitMobileNotIOS) {
                    $wrap.css({
                        position: 'absolute'
                    });
                }
                PORTFOLIO_SCROLLTO_OFFSET = window.responsiveState === 'mobile' ? $('.menu-ghost').height() : 137;
                $window.trigger('scroll-to', [window.mobileMenuYOffset = ($portfolio.offset().top - PORTFOLIO_SCROLLTO_OFFSET - window.curScrollTop)]);
            }*/ else if (e.currentTarget.getAttribute('data-attr') === 'back' && (hasLoadedTiles || doTileAjax || doArticleAjax)) {
                if(isTileView || window.mobileMenuIsOpen) {
                    return false;
                }
                if (IS_CHROME) {
                    $body.css('height', Math.max(articleScrollTop + tileScrollTop) + window.pageHeight);
                    chromeUsedBackLink = true;
                }
                if (!window.isTileView) {
                    backFn = !wasLinkClick && window.history.state === initialHistoryState ? History.forward : History.back;
                    if (window.isWebkitMobileNotIOS) {
                        backFn();
                    } else {
                        window.setTimeout(window.requestAnimationFrame.bind(null, backFn), 0);
                    }
                }
            } else if (url === pageUrl) {
                $window.trigger('same-page');
            } else {
                pageUrl = url;
                pageTitle = 'Myplanet Digital';
                if (e.currentTarget.getAttribute('data-attr') !== 'back') {
                    linkClickedTime = new Date();
                }
                if (url.match(ARTICLE_REGEX)) {
                    pageTitle = $('a[href="' + url + '"].tile-title .main-title').text() + ' | Myplanet Digital';
                    if(($link = $(this)).hasClass('tile-title')) {
                        $link.closest('.content').addClass('active-tile');
                    }
                } else if (url.match(TAG_REGEX)) {
                    // Add an active class to the menu earlier.
                    $link = $(this);
                    linkTag = $link.attr('data-tag');
                    $link.closest('ul').find('li.active').removeClass('active');
                    $link.closest('li').addClass('active');
                    if (linkTag) {
                        pageTitle = (linkTag !== 'home') ? linkTag.charAt(0).toUpperCase() + linkTag.slice(1) + ' | Myplanet Digital' : 'Myplanet Digital';
                    }
                }

                if (!window.isWebkitMobileNotIOS || !window.mobileMenuIsOpen) {
                    History.pushState({}, pageTitle, pageUrl);
                } else {
                    window.setTimeout(window.requestAnimationFrame.bind(null, function() {
                        //chromePopStateTimeout = IS_CHROME;
                        History.pushState({}, pageTitle, pageUrl);
                    }), 0);
                }
            }

            return false;
        }
    });

    //$article.append($articleFooter = $footer.clone());


    $window.on('page-change', function() {
        if (!pageLoaded) {
            return;
        }
        if(window.ga) {
         window.ga('send', 'pageview', window.document.location.pathname);
        }

        if (IS_CHROME && chromeUsedBackLink) {
            $body.css('height', Math.max(articleScrollTop + tileScrollTop) + window.pageHeight);
        }
        if (!isTransitioning && !isTransitionEnding && $ajaxer === null) {
            if (window.isTileView) {
                tileScrollTop = window.isIOS && ! window.isIOS8 ? window.pageYOffset : window.curScrollTop;
            } else {
                articleScrollTop = window.isIOS && ! window.isIOS8 ? window.pageYOffset : window.curScrollTop;
            }
        }
        if (!IS_CHROME || !chromeUsedBackLink) {
            handlePageChange();
        } else {
            chromePopStateTimeout = window.setTimeout(handlePageChange, 0);
        }

    });
    //$window.on('page-change', handlePageChange);
    $article.on('transitionend webkitTransitionEnd', handleTransitionEnd);

    //global scroll handler
    $window.on('scroll' + (IS_SAFARI && !window.isIOS ? ' mousewheel' : ''), function() {
        if (window.isIOS) {
            return;
        }

        if (chromePopStateTimeout) {
            window.clearTimeout(chromePopStateTimeout);
            chromePopStateScrollTop = window.pageYOffset;

            return handlePageChange();
        }

        if (isTransitioning || isLoading || isTransitionEnding) {
            return;
        }
        window.curScrollTop = window.pageYOffset;
        if (!window.isScrolling) {
            startScrolling();
        }

        $window.trigger('pageScroll', [{
            top: window.curScrollTop,
            bottom: window.curScrollTop + window.pageHeight,
            isFinalEvent: false
        }]);

        if (scrollTimeout) {
            window.clearTimeout(scrollTimeout);
            window.clearTimeout(preScrollTimeout);
        }
        scrollTimeout = window.setTimeout(endScrolling, END_SCROLL_THRESHOLD);
        preScrollTimeout = window.setTimeout(function() {
            $window.trigger('pageScroll', [{
                top: window.curScrollTop,
                bottom: window.curScrollTop + window.pageHeight,
                isFinalEvent: true
            }]);
        }, PRE_SCROLL_THRESHOLD);
    });

    window.setTimeout(function() {
        if (!window.isTileView) {
            //$articlein.addClass('reveal');
            $back.addClass('reveal');
            // set link to return to primary tag on landing on article
            $backlink.attr('href', window.currentTag === 'home' ? '/' : '/tags/' + window.currentTag);
            articleScrollTop = window.curScrollTop;
            isFirstArticleLoad = false;
        } else {
            tileScrollTop = window.curScrollTop;
        }
        pageLoaded = true;
    }, 500);

    window.requestAnimationFrame(function() {
        if (!window.isTileView) {
            lastArticleUrl = pageUrl;
        }
        $body.addClass('loaded');
    });
}());
