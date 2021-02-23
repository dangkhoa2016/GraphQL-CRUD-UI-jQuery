function ModalForm(options = {}) {
  var renderer = null;
  var entityName = options.entityName || '';
  var formTemplate = options.formTemplate || '';

  if (formTemplate) {
    renderer = Handlebars.compile(formTemplate);
  }

  function bindClick(btn, action, handler) {
    if (btn.length > 0) {
      btn.unbind('click').bind('click', function (e) {
        e.preventDefault();
        if (typeof handler === "function") {

          var form_json = null;
          if (mdForm.is(':visible')) {
            form_json = GetFormData(mdForm.find('form'));
            if (form_json) {
              var ___id = form_json['___id'];
              form_json['id'] = ___id;
              delete form_json['___id'];
            }
          }

          if (!form_json)
            form_json = { id: currentId };
          handler(action, form_json);
        }
      });
    }
  }

  var mdForm = $('#modal-form');
  var mdConfirm = $('#modal-confirm');
  var btnAction = mdForm.find('#btn-agree');
  var btnDelete = mdConfirm.find('#btn-delete');
  var currentId = '';

  this.showFormNew = function (data, action, onClick) {
    bindClick(btnAction, action, onClick);
    var html = '';
    if (renderer) {
      html = renderer(data);
      mdForm.find('.modal-body').html(html);
    }
    mdForm.find('.modal-title').html('Create ' + entityName);
    mdForm.modal('show');
  };

  this.showFormEdit = function (data, action, onClick) {
    bindClick(btnAction, action, onClick);
    var html = '';
    if (renderer) {
      html = renderer(data);
      mdForm.find('.modal-body').html(html);
    }
    mdForm.find('.modal-title').html('Edit ' + entityName);
    mdForm.modal('show');
  };

  this.showFormConfirmDelete = function (data, action, onClick) {
    currentId = data.id || '';
    bindClick(btnDelete, action, onClick);
    mdConfirm.find('.modal-body .name').html(entityName);

    mdConfirm.modal('show');
  };

  this.closeForm = function () {
    mdConfirm.modal('hide');
    mdForm.modal('hide');
  }
}