/*-- Lazy loader Image --*/
var targets =[].slice.call(
    document.querySelectorAll(".lazy > source")
   )
const imgOptions = {
    threshhold: 1, // 1 là toàn bộ bức ành
    rootMargin: "0px 0px 6000px 0px",
}
var size, autoMedia, autoType;
var width = window.innerWidth
if (width > 1000) {
    size = "-large.jpeg"
    // autoMedia = "(min-width: 1000px)"
    autoType = 'image/jpeg'
} else if (width > 550) {
    size = "-medium.webp"
    // autoMedia = "(min-width: 550px)"
    autoType = 'image/webp'
} else if (width < 550) {
    size = "-small.webp"
    // autoMedia = "(max-width: 550px)"
    autoType = 'image/webp'
}
if ("IntersectionObserver" in window) {
    const lazyLoad = target => {
        const io = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                //console.log('😍');
                if (entry.isIntersecting) {
                    
                    let lazyImage = entry.target;
                    // lazyImage.media = autoMedia
                    lazyImage.type = autoType

                    lazyImage.dataset.srcset += size
                    lazyImage.srcset = lazyImage.dataset.srcset;
                    lazyImage.nextElementSibling.srcset = lazyImage.dataset.srcmain;
                    // lazyImage.nextElementSibling.classList.add('fade-in');
                    lazyImage.parentElement.classList.remove("lazy");
                    
                    observer.disconnect();
                }
    
            });
        }, imgOptions);
    
        io.observe(target)
    };
    
    targets.forEach(lazyLoad);
} else {
    // Not supported, load all images immediately
    lazyImages.forEach(function (image) {
        image.nextElementSibling.src = image.nextElementSibling.dataset.srcset;
    });
}

/*-- End Lazy loader Image --*/