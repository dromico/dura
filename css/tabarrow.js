$(document).ready(function(){
    jQuery(".toggle_content").hide();

    jQuery(".toggle_title").click(function() {
        var $arrow = jQuery(".toggle_arrow", this);
        var $content = jQuery(this).nextAll(".toggle_content");

        // Toggle arrow state
        $arrow.toggleClass("toggle_active");

        // Toggle content
        $content.slideToggle();
    });

    jQuery(".toggle_bottom_arrow").click(function() {
        var $content = jQuery(this).parent(".toggle_content");
        var $wrapper = $content.parent(".toggle_wrapper");

        // Hide content and reset arrow
        $content.slideToggle();
        $wrapper.find(".toggle_arrow").removeClass("toggle_active");
    });
});