/* Dore Single Theme Initializer Script 

Table of Contents

01. Single Theme Initializer
*/

/* 01. Single Theme Initializer */

(function ($) {
  if ($().dropzone) {
    Dropzone.autoDiscover = false;
  }

  var direction = "ltr";
  var radius = "rounded";
  var theme = localStorage.getItem('theme');
  console.log(theme)

  if (theme == null) {
    localStorage.setItem('theme', 'light');
    var theme = localStorage.getItem('theme');
    console.log(theme)
  }

  if (typeof Storage !== "undefined") {

    const BtnSwitch = $('#switchDark')
    if (theme === 'dark') {
      $(":root").addClass(theme)
      BtnSwitch.prop("checked", true);

    } else if (theme === 'light') {
      BtnSwitch.prop("checked", false);
    }

    BtnSwitch.on('click', () => {
      var theme = localStorage.getItem('theme'); //set lại biến theme
      if (theme == "light") {

        console.log('switched to theme:' + 'dark')

        $(":root").addClass('dark')

        localStorage.setItem('theme', 'dark');


      }
      if (theme == "dark") {

        console.log('switched to theme:' + 'light')

        $(":root").removeClass('dark')

        localStorage.setItem('theme', 'light');


      }
    });
    if (localStorage.getItem("dore-direction")) {
      direction = localStorage.getItem("dore-direction");
    } else {
      localStorage.setItem("dore-direction", direction);
    }
    if (localStorage.getItem("dore-radius")) {
      radius = localStorage.getItem("dore-radius");
    } else {
      localStorage.setItem("dore-radius", radius);
    }
  }

  $("body").addClass(direction);
  $("html").attr("dir", direction);
  $("body").addClass(radius);
  $("body").dore();
})(jQuery);
