/* 0.1 Loader */
$(window).on('load', function () {
    // PAGE IS FULLY LOADED  
    // FADE OUT YOUR OVERLAYING DIV
    $('#loader').fadeOut("slow");
}); /* 😃 0.1 Loader */



/* 0.2 Hambuger Bar */
$('#navbarSupportedContent').on('show.bs.collapse', function () {
    $('#subnav').removeClass('hide-hambuger-phone')
})
$('#navbarSupportedContent').on('hidden.bs.collapse', function () {
    $('#subnav').addClass('hide-hambuger-phone')
}) /* 🤣 End Hambuger Bar */



/* 0.3. Glide */
if (typeof Glide !== "undefined") {

    // Details Images
    if ($(".glide.details").length > 0) {
        var glideThumbCountMax = 5;
        var glideLength = $(".glide.thumbs li").length;
        var perView = Math.min(glideThumbCountMax, glideLength);

        var glideLarge = new Glide(".glide.details", {
            bound: true,
            rewind: false,
            focusAt: 0,
            perView: 1,
            startAt: 0,
            direction: 'ltr',
        });

        var glideThumbs = new Glide(".glide.thumbs", {
            bound: true,
            rewind: false,
            perView: perView,
            perTouch: 1,
            focusAt: 0,
            startAt: 0,
            direction: 'ltr',
            breakpoints: {
                576: {
                    perView: Math.min(4, glideLength)
                },
                420: {
                    perView: Math.min(3, glideLength)
                }
            }
        });

        $(".glide.thumbs").css("width", perView * 70);
        addActiveThumbClass(0);

        $(".glide.thumbs li").on("click", function (event) {
            var clickedIndex = $(event.currentTarget).index();
            glideLarge.go("=" + clickedIndex);
            addActiveThumbClass(clickedIndex);
        });

        glideLarge.on(["swipe.end"], function () {
            addActiveThumbClass(glideLarge.index);
        });

        glideThumbs.on("resize", function () {
            perView = Math.min(glideThumbs.settings.perView, glideLength);
            $(".glide.thumbs").css("width", perView * 70);
            if (perView >= $(".glide.thumbs li").length) {
                $(".glide.thumbs .glide__arrows").css("display", "none");
            } else {
                $(".glide.thumbs .glide__arrows").css("display", "block");
            }
        });

        function addActiveThumbClass(index) {
            $(".glide.thumbs li").removeClass("active");
            $($(".glide.thumbs li")[index]).addClass("active");
            var gap = glideThumbs.index + perView;
            if (index >= gap) {
                glideThumbs.go(">");
            }
            if (index < glideThumbs.index) {
                glideThumbs.go("<");
            }
        }
        glideThumbs.mount();
        glideLarge.mount();
    }

    // Dashboard Numbers
    if ($(".glide.dashboard-numbers").length > 0) {
        new Glide(".glide.dashboard-numbers", {
            bound: true,
            rewind: false,
            perView: 4,
            perTouch: 1,
            focusAt: 0,
            startAt: 0,
            direction: 'ltr',
            gap: 7,
            breakpoints: {
                1800: {
                    perView: 3
                },
                576: {
                    perView: 2
                },
                320: {
                    perView: 1
                }
            }
        }).mount();
    }

    // Dashboard Best Rated
    if ($(".best-rated-items").length > 0) {
        new Glide(".best-rated-items", {
            gap: 10,
            perView: 1,
            direction: 'ltr',
            type: "carousel",
            peek: { before: 0, after: 100 },
            breakpoints: {
                480: { perView: 1 },
                992: { perView: 2 },
                1200: { perView: 1 }
            },
        }).mount();
    }


    if ($(".glide.basic").length > 0) {
        new Glide(".glide.basic", {
            gap: 0,
            rewind: false,
            bound: true,
            perView: 3,
            direction: 'ltr',
            breakpoints: {
                600: { perView: 1 },
                1000: { perView: 2 }
            },
        }).mount();
    }

    if ($(".glide.center").length > 0) {
        new Glide(".glide.center", {
            gap: 0,
            type: "carousel",
            perView: 4,
            direction: 'ltr',
            peek: { before: 50, after: 50 },
            breakpoints: {
                600: { perView: 1 },
                1000: { perView: 2 }
            },
        }).mount();
    }

    if ($(".glide.single").length > 0) {
        new Glide(".glide.single", {
            gap: 0,
            type: "carousel",
            perView: 1,
            direction: 'ltr',
        }).mount();
    }



    if ($(".glide.gallery").length > 0) {
        var enableClick = true;
        var glideGallery = new Glide(".glide.gallery", {
            gap: 10,
            perTouch: 1,
            perView: 1,
            type: "carousel",
            peek: { before: 100, after: 100 },
            direction: direction
        })

        glideGallery.on(["swipe.move"], function () {
            enableClick = false;
        });

        glideGallery.on(["run.after"], function () {
            enableClick = true;
        });

        glideGallery.mount();

        $(".glide.gallery").get(0).addEventListener('click', function (event) {
            if (!enableClick) {
                event.stopPropagation();
                event.preventDefault();
                return false;
            } else {
                return true;
            }
        }, true);

    }
}  /* 😆 End Glide */