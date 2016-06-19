/**
 * Created by abratin on 6/11/16.
 */

$(document).ready(function() {
    $("a[rel^='prettyPhoto']").prettyPhoto();
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



    // $('form').on('submit', function(evt) {
    //     evt.preventDefault();
    //     var files = $('#files-select')[0].files;
    //     var formData = new FormData();
    //     var validFilesCount = 0;
    //     // loop through all the selected files
    //     for (var i = 0; i < files.length; i++) {
    //         var file = files[i];
    //         if (/image\/*/.test(file.type)) {
    //             // add the files to formData object for the data payload
    //             validFilesCount++;
    //             formData.append('uploads[]', file, file.name);
    //         }
    //     }
    //     if(validFilesCount>0) {
    //         var progressBar = $('.progress-bar');
    //         var status = $('#status');
    //         var form = $(this)[0];
    //         $.post({
    //             async: true,
    //             url: form.action,
    //             data: formData,
    //             processData: false,
    //             contentType: false,
    //             beforeSend: function (XMLHttpRequest) {
    //                 status.empty();
    //                 progressBar.text('0%');
    //                 progressBar.width('0%');
    //                 $('div.progress').removeClass('hide');
    //             },
    //             xhr: function() {
    //                 // get the native XmlHttpRequest object
    //                 var xhr = $.ajaxSettings.xhr();
    //                 // set the onprogress event handler
    //                 xhr.upload.onprogress = function (evt) {
    //                     if (evt.lengthComputable) {
    //                         var percentComplete = 100 * (evt.loaded / evt.total);
    //                         var percentVal = percentComplete + '%';
    //                         progressBar.width(percentVal);
    //                         progressBar.text(percentVal);
    //                     }
    //                     return xhr;
    //                 };
    //             },
    //             complete: function (xhr) {
    //                 status.html(xhr.responseText);
    //             }
    //         });
    //     }
    // });

});