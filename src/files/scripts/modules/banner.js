(function banner() {
  if (!window.isSinglePageApp) {
    return;
  }
  var $menu = $('#menu'),
      $banner = $('#banner'),
      $bannerText = $('#banner > .banner-text'),
      bannerInfo = {};

  $('#menu').find('a').each(function(){
    var me = $(this),
        tag = me.data('tag');
    bannerInfo[tag] = {
      'bannerText' : me.data('banner')
    };
  });

  function bannerUpdate(tag, immediate) {
      var bannerText = bannerInfo[tag]['bannerText'];

     if(window.responsiveState === 'mobile' && window.mobileMenuIsOpen) {
        immediate = true;
     }
     $bannerText.css({opacity: 0.01, transition: 'none'});
     $banner.css('transition', immediate ? 'none' : '');
     if(immediate) {

       //return window.requestAnimationFrame(function () {
          $banner.attr('class', tag);
          $bannerText.html(bannerText).css({'opacity': 0.99, 'transition' : 'none'});
          return window.setTimeout(function () {
              $banner.css('transition','');
              $bannerText.css('transition','');
          }, 0);
        //});
      //});
    }

    window.setTimeout(function() {
      $banner.attr('class', tag);
      $banner.css('transition','');
      $bannerText.html(bannerText).css({'opacity': 0.99, 'transition' : ''});
    }, 0);
  }

  $(window).on('filter', function(e, tag, immediate){
    bannerUpdate(tag, immediate);
  });

}());
