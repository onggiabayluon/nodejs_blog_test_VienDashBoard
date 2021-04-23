/*-- Lazy loader Image --*/
const targets = document.querySelectorAll('.thumbnailsLoader');
const imgOptions = {
    threshhold: 1, // 1 là toàn bộ bức ành
    rootMargin: "2000px",
}
const baseUrl = `https://cloudimagewall.xyz`

    const lazyLoad = target => {
        const io = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    var img = new Image ();
                    img = entry.target; // Current Image
                    const src = img.getAttribute('data-bg');
                    
                    {
                       
                        const { clientWidth, clientHeight } = img
                        const pixelRatio = window.devicePixelRatio || 1.0
                        const imageParams = `fit-in/130x0/filters:quality(75)/filters:autojpg()`
                        //const imageParams = `w_${100 * Math.round(finalSize * pixelRatio / 100)},h_${100 * Math.round(finalSize * pixelRatio / 100)},q_auto,c_fill,f_auto`
                        //,g_auto nhận diện tiêu điểm ảnh
                        const url = `${baseUrl}/${imageParams}/${img.dataset.bg}`
                        img.src = `${url}`
                        //img.style.backgroundImage = `url('${url}')`
                    }   
                    observer.disconnect();
                }
            });
        }, imgOptions);

        io.observe(target)
    };

    targets.forEach(lazyLoad);
/*-- End Lazy loader Image --*/

