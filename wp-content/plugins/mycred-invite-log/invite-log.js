// invite-log.js
function copyToClipboard(id) {
    var inviteLink = document.getElementById(id);
    inviteLink.select();
    inviteLink.setSelectionRange(0, 99999); // For mobile devices
    document.execCommand("copy");
    alert("复制成功");
}