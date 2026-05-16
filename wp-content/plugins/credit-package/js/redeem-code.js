jQuery(document).ready(function($) {
    $('#redeem-code-form').on('submit', function(e) {
        e.preventDefault();

        var code = $('#code').val();

        $.ajax({
            url: redeem_code_ajax.ajaxurl,
            type: 'POST',
            data: {
                action: 'redeem_code',
                code: code
            },
            beforeSend: function() {
                $('#redeem-animation').html('');
            },
            success: function(response) {
                var jsonResponse = JSON.parse(response);
                if (jsonResponse.status === 'success') {
                    $('#redeem-animation').html(jsonResponse.message);
                    showToast(jsonResponse.message);
                } else {
                    showToast(jsonResponse.message);
                }
            },
            error: function() {
                showToast('请求失败，请重试');
            }
        });
    });

    function showToast(message) {
        var toast = document.createElement("div");
        toast.className = "toast";
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.classList.add("show");
        }, 100);

        setTimeout(function() {
            toast.classList.remove("show");
            setTimeout(function() {
                toast.remove();
            }, 300);
        }, 3000);
    }
});