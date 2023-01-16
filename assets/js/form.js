window.ModalForm = function (options = {}) {
  let renderer = null;
  const entityName = options.entityName || '';
  const formTemplate = options.formTemplate || '';

  if (formTemplate)
    renderer = Handlebars.compile(formTemplate);

  function bindClick(btn, action, handler) {
    if (btn.length === 0)
      return;

    btn.unbind('click').bind('click', function (e) {
      e.preventDefault();

      if (typeof handler !== 'function')
        return;

        let form_json = null;
      if (mdForm.is(':visible')) {
        form_json = GetFormData(mdForm.find('form'));
        if (form_json) {
          const ___id = form_json['___id'];
          form_json['id'] = ___id;
          delete form_json['___id'];
        }
      }

      if (!form_json)
        form_json = { id: currentId };
      handler(action, form_json);
    });
  }

  const mdForm = $('#modal-form');
  mdForm.on('shown.bs.modal', function (e) {
    $(this).find('.form-control:first').focus();
  });
  const mdConfirm = $('#modal-confirm');
  const btnAction = mdForm.find('#btn-agree');
  const btnDelete = mdConfirm.find('#btn-delete');
  let currentId = '';

  this.showFormNew = function (data, action, onClick) {
    bindClick(btnAction, action, onClick);
    let html = '';
    if (renderer) {
      html = renderer(data);
      mdForm.find('.modal-body').html(html);
    }
    mdForm.find('.modal-title').html('Create ' + entityName);
    mdForm.modal('show');
  };

  this.showFormEdit = function (data, action, onClick) {
    bindClick(btnAction, action, onClick);
    let html = '';
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
  };
};
