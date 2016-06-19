/**
 * Created by abratin on 6/11/16.
 */

$(document).ready(function() {
    $("a[rel^='prettyPhoto']").prettyPhoto();
});

$('#toggleSelectMode').click(function(e) {
    e.preventDefault();
    e.stopPropagation();
    var isDisabled = $( ".selectable" ).selectable( "option", "disabled" );
    var trigger = isDisabled ? "enable" : "disable";
    $('.selectable').selectable(trigger);
    if(!isDisabled) {
        $('.ui-widget-content').removeClass('ui-selected');
        $('.ui-widget-content').removeClass('ui-selectee');
        $('.footer').removeClass('show');
    }
});

$('a').click(function(e){
    var isDisabled = $( ".selectable" ).selectable( "option", "disabled" );
    if(!isDisabled) {
        e.stopImmediatePropagation();
        e.preventDefault();
    }
});

$(function() {
    $(".selectable").selectable({
        filter:'img',
        selecting:function(e, ui) { // on select
            var curr = $(ui.selecting.tagName, e.target).index(ui.selecting); // get selecting item index
            if(e.shiftKey && prev > -1) { // if shift key was pressed and there is previous - select them all
                $(ui.selecting.tagName, e.target).slice(Math.min(prev, curr), 1 + Math.max(prev, curr)).addClass('ui-selected');
                prev = -1; // and reset prev
            } else {
                prev = curr; // othervise just save prev
            }
        },
        selected: function(e) {
            if($(".ui-widget-content.ui-selected").length > 0) {
                $('.footer').addClass("show");
            }
        },
        unselected: function(e) {
            if($(".ui-widget-content.ui-selected").length <= 0) {
                $('.footer').removeClass("show");
            }
        }
    });
    $(".selectable").on("selectablestart", function (event, ui) {
        event.originalEvent.ctrlKey = true;
    });
    $('.selectable').selectable('disable');
});


$(function() {

    var showInfo = function(message) {
        $('div.progress').addClass('hide');
        $('strong.message').text(message);
        $('div.alert').show();
    };

    var ul = $('#upload ul');
    $('#upload').fileupload({

        add: function (e, data) {

            var tpl = $('<li class="working"><input type="text" value="0" data-width="48" data-height="48"'+
              ' data-fgColor="#0788a5" data-readOnly="1" data-bgColor="#3e4043" /><p></p><span></span></li>');

            // Append the file name and file size
            tpl.find('p').text(data.files[0].name)
              .append('<i>' + formatFileSize(data.files[0].size) + '</i>');

            // Add the HTML to the UL element
            data.context = tpl.appendTo(ul);

            // Initialize the knob plugin
            tpl.find('input').knob();

            // Listen for clicks on the cancel icon
            tpl.find('span').click(function(){

                if(tpl.hasClass('working')){
                    jqXHR.abort();
                }

                tpl.fadeOut(function(){
                    tpl.remove();
                });

            });

            // Automatically upload the file once it is added to the queue
            var jqXHR = data.submit();
        },

        progress: function(e, data){

            // Calculate the completion percentage of the upload
            var progress = parseInt(data.loaded / data.total * 100, 10);

            // Update the hidden input field and trigger a change
            // so that the jQuery knob plugin knows to update the dial
            data.context.find('input').val(progress).change();

            if(progress == 100){
                data.context.removeClass('working');
            }
        },

        fail:function(e, data){
            // Something has gone wrong!
            data.context.addClass('error');
        }

    });

    function formatFileSize(bytes) {
        if (typeof bytes !== 'number') {
            return '';
        }

        if (bytes >= 1000000000) {
            return (bytes / 1000000000).toFixed(2) + ' GB';
        }

        if (bytes >= 1000000) {
            return (bytes / 1000000).toFixed(2) + ' MB';
        }

        return (bytes / 1000).toFixed(2) + ' KB';
    }

});