
// jQuery to collapse the navbar on scroll
$(window).scroll(function() {
    if ($(".navbar").offset().top > 50) {
        $(".navbar-fixed-top").addClass("top-nav-collapse");
    } else {
        $(".navbar-fixed-top").removeClass("top-nav-collapse");
    }
});

// jQuery for page scrolling feature - requires jQuery Easing plugin
$(function() {
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $($anchor.attr('href')).offset().top
        }, 1500, 'easeInOutExpo');
        event.preventDefault();
    });
});

// Closes the Responsive Menu on Menu Item Click
$('.navbar-collapse ul li a').click(function() {
    $('.navbar-toggle:visible').click();
});

let legend_toggler = document.getElementById("legend_toggler");
legend_toggler.addEventListener("click", function () {
    let legend = document.querySelector(".info.legend .legend-cont");
    let toggler_label = document.getElementById("legend_toggler_label");
    let css_tr = legend_toggler.style.transform;
    if (!css_tr || css_tr === "rotate(90deg)") {
        legend.style.maxHeight = 0;
        legend_toggler.style.transform = "rotate(-90deg)";
        setTimeout(function () {
            toggler_label.style.maxHeight = "100vh";
        }, 500);
    } else {
        toggler_label.style.maxHeight = 0;
        legend.style.maxHeight = "100vh";
        legend_toggler.style.transform = "rotate(90deg)";
    }
});
