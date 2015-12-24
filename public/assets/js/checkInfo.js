$(function() {
    var $form = $('#form-with-tooltip');
    var $tooltip = $('<div id="vld-tooltip">提示信息！</div>');
    $tooltip.appendTo(document.body);

    $form.validator();

    var validator = $form.data('amui.validator');

    $form.on('focusin focusout', '.am-form-error input', function(e) {
        if (e.type === 'focusin') {
            var $this = $(this);
            var offset = $this.offset();
            var msg = $this.data('foolishMsg') || validator.getValidationMessage($this.data('validity'));

            $tooltip.text(msg).show().css({
                left: offset.left + 10,
                top: offset.top + $(this).outerHeight() - 90
            });
        } else {
            $tooltip.hide();
        }
    });
});
function createRequest(){
    try{
        request = new XMLHttpRequest();
    }catch(tryMS){
        try{
            request = new ActiveXObject("Msxm12.XMLHTTP");
        }catch(otherMS){
            try{
                request = new ActiveXObject("Microsoft.XMLHTTP");
            }catch(failed){
                request = null;
            }
        }
    }
    return request;
}
function checkVerify(){
    var verify = document.getElementById("inputVerify3").value;
    request = createRequest();
    if(request == null){
         alert("该浏览器不支持Ajax技术！");
    }else{
        var url = "/checkVerify/"+verify;
        request.onreadystatechange = showVerifyStatus;
        request.open("GET",url,true);
        request.send(null);
    }
}
function showVerifyStatus(){{
    if(request.readyState == 4){
        if(request.status == 200){
            if(request.responseText == "okay"){
                document.getElementById("inputVerify3").setAttribute('style','border-color:green !important; width:70%; display:inline-block');
            }else{
                document.getElementById("inputVerify3").setAttribute('style','border-color:red !important; width:70%; display:inline-block');
            }
        }
    }
}}
