var $ = require('jquery');
window.jQuery = $;
window.$ = $;

HomeController.$inject = [];
export default function HomeController($stateParams) {
  var vm = this;
  $(async () => {
    var mainImage = $('#main-image-carousel');
    var thumbs = $('#thumbs-home-carousel');
    var syncedSecondary = true;

    mainImage
      .owlCarousel({
        items: 1,
        slideSpeed: 2000,
        dots: false,
        loop: true,
        responsiveRefreshRate: 200,
        nav: true,
        navText: [
          '<i class="fa fa-arrow-circle-left fa-2x" style="line-height: 1.5 !important;" aria-hidden="true"></i>',
          '<i class="fa fa-arrow-circle-right fa-2x" style="line-height: 1.5 !important;" aria-hidden="true"></i>'
        ]
      })
      .on('changed.owl.carousel', syncPosition);

    thumbs
      .on('initialized.owl.carousel', function () {
        thumbs
          .find('.owl-item')
          .eq(0)
          .addClass('current');
      })
      .owlCarousel({
        items: 2,
        smartSpeed: 200,
        slideSpeed: 500,
        slideBy: 2,
        responsiveRefreshRate: 100,
        touchDrag: false,
        mouseDrag: false
      })
      .on('changed.owl.carousel', syncPosition2);

    function syncPosition(el) {
      var count = el.item.count - 1;
      var current = Math.round((el.item.index - el.item.count) / (2 - 0.5));

      if (current < 0) {
        current = count;
      }
      if (current > count) {
        current = 0;
      }
      thumbs
        .find('.owl-item')
        .removeClass('current')
        .eq(current)
        .addClass('current');
      var onscreen = thumbs.find('.owl-item.active').length - 1;
      var start = thumbs
        .find('.owl-item.active')
        .first()
        .index();
      var end = thumbs
        .find('.owl-item.active')
        .last()
        .index();

      if (current > end) {
        thumbs.data('owl.carousel').to(current, 100, true);
      }
      if (current < start) {
        thumbs.data('owl.carousel').to(current - onscreen, 100, true);
      }
    }

    function syncPosition2(el) {
      if (syncedSecondary) {
        var number = el.item.index;
        mainImage.data('owl.carousel').to(number, 100, true);
      }
    }

    thumbs.on('click', '.owl-item', function (e) {
      e.preventDefault();
      var number = $(this).index();
      mainImage.data('owl.carousel').to(number, 300, true);
    });
  });
}
