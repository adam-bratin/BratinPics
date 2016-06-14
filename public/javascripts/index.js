/**
 * Created by abratin on 6/11/16.
 */
$(function() {

    var showInfo = function(message) {
        $('div.progress').addClass('hide');
        $('strong.message').text(message);
        $('div.alert').show();
    };

    $('form').on('submit', function(evt) {
        evt.preventDefault();
        var files = $('#files-select')[0].files;
        var formData = new FormData();
        var validFilesCount = 0;
        // loop through all the selected files
        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            if (/image\/*/.test(file.type)) {
                // add the files to formData object for the data payload
                validFilesCount++;
                formData.append('uploads[]', file, file.name);
            }
        }
        if(validFilesCount>0) {
            var progressBar = $('.progress-bar');
            var status = $('#status');
            var form = $(this)[0];
            $.post({
                url: form.action,
                data: formData,
                processData: false,
                contentType: false,
                beforeSend: function (XMLHttpRequest) {

                    status.empty();
                    progressBar.text('0%');
                    progressBar.width('0%');
                    $('div.progress').removeClass('hide');
                },
                xhrFields: {
                    onprogress: function (evt) {
                        if (evt.lengthComputable) {
                            var percentComplete = 100*(evt.loaded / evt.total);
                            var percentVal = percentComplete + '%';
                            progressBar.width(percentVal);
                            progressBar.text(percentVal);
                        }
                    }
                },
                complete: function (xhr) {
                    status.html(xhr.responseText);
                }
            })
        }
    });

});