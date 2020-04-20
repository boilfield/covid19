let lang_btn = document.getElementById("map_lang");

if (!localStorage.getItem("map_lang")) {
    localStorage.setItem("map_lang", "bn");
}

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

(function () {
    if (localStorage.getItem("map_lang")==="en") {
        lang_btn.textContent = "Bengali";
        lang_btn.title = "Switch to Bengali";
    } else {
        lang_btn.textContent = "English";
        lang_btn.title = "Switch to English";
    }
})();

lang_btn.addEventListener("click", function () {
    if (lang_btn.textContent==="English") {
        localStorage.setItem("map_lang", "en");
    } else {
        localStorage.setItem("map_lang", "bn");
    }
});
