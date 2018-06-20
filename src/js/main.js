window.onload = function() {
  $('.nav-menu__toggle').on('click', function() {
    if ($('.nav-menu').hasClass('nav-menu--closed')) {
      $('.nav-menu').removeClass('nav-menu--closed');
      $('.nav-menu').addClass('nav-menu--opened');
    } else {
      $('.nav-menu').removeClass('nav-menu--opened');
      $('.nav-menu').addClass('nav-menu--closed');
    };
  });



}
