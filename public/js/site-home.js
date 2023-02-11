let last_slide = Date.now()

function reiniciarEsperaSlide() {
	last_slide = Date.now()
}

function initGlider() {
	const glider = new Glider(document.querySelector('.carousel__lista'), {
		slidesToShow: 1,
		slidesToScroll: 1,
		dots: '.carousel__indicadores',
		arrows: {
			prev: '.carousel__anterior',
			next: '.carousel__siguiente'
		},
	});

	let miliseconds = 3000;

	const slidesCount = glider.track.childElementCount;
	setInterval(() => {
		if (Date.now() - last_slide > miliseconds) {
			if (glider.slide >= slidesCount - 1) {
				glider.scrollItem(0);
			} else {
				glider.scrollItem(glider.slide + 1);
			}
			reiniciarEsperaSlide()
		}
	}, 500);
}


actualizarCarousel()

function actualizarCarousel() {
	let carousel = document.querySelectorAll(".carousel__lista")[0]
	let html = ""
	for (const r of sheet.home_carrousel) {
		html += `
                <div class="carousel__elemento">
                    <div 
                        style="background-image: url(${r});"
                        class="carousel__background"
                    >
                    </div>
                    <img src="${r}">
                </div>
                `
	}
	carousel.innerHTML = html
	initGlider();
}