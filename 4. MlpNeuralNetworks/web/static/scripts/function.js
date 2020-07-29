function showAlert(title, message) {
    $('#error-title').html(title);
    $('#error-body').html(message)
    $('#error-modal').modal('show');
}