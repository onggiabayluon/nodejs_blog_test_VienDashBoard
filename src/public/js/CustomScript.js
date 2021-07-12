/* 0.1 Loader */
$(window).on('load', function () {
    // PAGE IS FULLY LOADED  
    // FADE OUT YOUR OVERLAYING DIV
    $('#loader').fadeOut("slow");
}); /* 😃 0.1 Loader */

$('#hidden-btn').on('click', () => {
    $('#categories-content').slideToggle('slow')
})

/* 0.2 Hambuger Bar */
$('#navbarSupportedContent').on('show.bs.collapse', function () {
    $('#subnav').removeClass('hide-hambuger-phone')
})
$('#navbarSupportedContent').on('hidden.bs.collapse', function () {
    $('#subnav').addClass('hide-hambuger-phone')
}) /* 🤣 End Hambuger Bar */


/* 0.3 Scroll */
// Optimalisation: Store the references outside the event handler:
var $window = $(window);
var $pane = $('#pane1');
var $subnav = $('#subnav')
var $subnavContainer = $('.subnav-container')
var $mainnav = $('#mainnav')
var $tempnav = $('#tempnav') 

function checkWidth() {
    var lastScrollTop = 0;
    var windowsize = $window.width();
    if (windowsize > 992) {
        
        $(window).scroll(function (event) {
            var st = $(this).scrollTop();
            
            if (st > lastScrollTop) {
                // downscroll code
                $subnav.removeClass('fixed-style')
                $subnavContainer.removeClass('subnav-container--p-0')
                $tempnav.addClass('d-none')
            } else {
                // upscroll code
                if (st < 100) {
                    $subnav.removeClass('fixed-style')
                    $subnavContainer.removeClass('subnav-container--p-0')
                    $tempnav.addClass('d-none')
                } else {
                    $subnav.addClass('fixed-style')
                    $subnavContainer.addClass('subnav-container--p-0')
                    $tempnav.removeClass('d-none')
                }
            }
            lastScrollTop = st;
        });

    } else {
        $(window).scroll(function (event) {

            var st = $(this).scrollTop();
            if (st > lastScrollTop) {
                // downscroll code
                $mainnav.removeClass('fixed-style')
            } else {
                // upscroll code
                if (st < 100) {
                    $tempnav.addClass('d-none')
                    $mainnav.removeClass('fixed-style')
                    $subnavContainer.removeClass('subnav-container--fixed')
                } else {
                    $mainnav.addClass('fixed-style')
                    $subnavContainer.addClass('subnav-container--fixed')
                }
                
            }
            lastScrollTop = st;
        });

    }
};
function reset() {
    $('#mainnav').removeClass('fixed-style')
    $('#subnav').removeClass('fixed-style')
    $('.subnav-container').removeClass('subnav-container--fixed')
    $('.subnav-container').removeClass('subnav-container--p-0')
    $(window).unbind('scroll');
};
// Execute on load
checkWidth();
// Bind event listener
$(window).resize(() => {
    reset()
    checkWidth()
});

/* 😘 End Scroll */

// Slider

// new Splide( '.splide', {
// 	type   : 'loop',
//     // startAt: 0,
//     perPage: 5,
// 	rewind : true,
//     height : '210px',
//     lazyLoad: 'nearby',
// 	// padding: {
// 	// 	right: '3rem',
// 	// 	left : '3rem',
// 	// },
// } ).mount();


/* 0.4. Glide */
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
    // if ($(".glide.dashboard-numbers").length > 0) {
    //     new Glide(".glide.dashboard-numbers", {
    //         bound: true,
    //         rewind: false,
    //         perView: 2,
    //         perTouch: 1,
    //         focusAt: 0,
    //         startAt: 0,
    //         direction: 'ltr',
    //         gap: 7,
    //         breakpoints: {
    //             1800: {
    //                 perView: 3
    //             },
    //             576: {
    //                 perView: 2
    //             },
    //             320: {
    //                 perView: 1
    //             }
    //         }
    //     }).mount();
    // }

    if ($("#glide_1").length > 0) {
        new Glide("#glide_1", {
            // type: 'carousel',
            gap: 15,
            rewind: false,
            bound: true,
            perView: 1,
            direction: 'ltr',
            // breakpoints: {
            //     600: { perView: 2},
            //     900: { perView: 3 },
            //     1200: { perView: 2 },
            // },
        }).mount();
    }
    if ($("#glide_2").length > 0) {
        new Glide("#glide_2", {
            gap: 0,
            rewind: false,
            bound: true,
            perView: 5,
            direction: 'ltr',
            breakpoints: {
                600: { perView: 2},
                900: { perView: 3 },
                1200: { perView: 4 },
            },
        }).mount();
    }
}  /* 😆 End Glide */

/* first slider */ 

var $AllSubthumbs = $('.subthumb')
var $mainThumb = $('.mainthumb')
var $meta__views = $('.meta__views')
var $meta__title = $('.meta__title')
var currentIndex = 0
$('.slider__item').on("mouseenter", function (e) {
    $meta__views.html(e.target.getAttribute('data-views'));
    $meta__title.html(e.target.getAttribute('data-title'));
    
    $mainThumb.fadeOut('200', () => {
        $mainThumb.attr("src", e.target.src);
        $mainThumb.fadeIn('300');
    })
    
});
// Slider Running 
play()

function play () {
    $AllSubthumbs.each((i, subthumb) => {
        //index, element, delay time
        setDelay(i, subthumb, 7000);
    });
};

function anim(subthumb) {

    if ( currentIndex === $AllSubthumbs.length - 1 ) {
        currentIndex = 0
        play()
    }

    $meta__views.html(subthumb.getAttribute('data-views'));
    $meta__title.html(subthumb.getAttribute('data-title'));

    $mainThumb.fadeOut('200', () => {
        $mainThumb.attr("src", subthumb.src);
        $mainThumb.fadeIn('300');
    })
};

function setDelay(i, subthumb, delay) {
    setTimeout(() => {
        anim(subthumb)
        currentIndex++
    }, i * delay);
};

  


/* first slider */ 