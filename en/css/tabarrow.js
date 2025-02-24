$(window).load(function(){
jQuery(".toggle_content").hide();

jQuery(".toggle_title").toggle(function() {
    jQuery(".toggle_arrow", this).addClass("toggle_active");
}, function() {
    jQuery(".toggle_arrow", this).removeClass("toggle_active");
});

jQuery(".toggle_title").click(function() {
    jQuery(this).nextAll(".toggle_content").slideToggle();
});

jQuery(".toggle_bottom_arrow").click(function() {
    jQuery(this).parent(".toggle_content").slideToggle().parent(".toggle_wrapper").find(".toggle_arrow").removeClass("toggle_active");
});
});//]]>  