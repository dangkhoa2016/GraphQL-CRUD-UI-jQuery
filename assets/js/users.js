window.table_js = null;
window.addition_file = { path: '/content/user_form.html', name: 'user_form' };
let formHelper = null;

const preloadData = {
  user: {}
};

const query = `
query { 
  users { id, name, email, status, phone, createdAt, updatedAt
    , points, posts { id, title }, comments {id, comment} }
}
`;

const getById = `
query Get_User($id: ID!) {
  getUser(id: $id) { 
    birthday
    createdAt
    email
    id
    name
    phone
    points
    status
    updatedAt
  }
}
`;

const mutationAdd = `
mutation Add_User($name: String!, $email: String!, $phone: String, $status: String, $birthday: String, $points: Int) {
  addUser(name: $name, email: $email, status: $status, phone: $phone, birthday: $birthday, points: $points) {
    id,name,email,phone,birthday,points, createdAt, updatedAt
  }
}
`;

const mutationEdit = `
mutation Edit_User($name: String!, $email: String!, $phone: String, $status: String, $birthday: String, $points: Int, $id: ID!) {
  updateUser(name: $name, email: $email, status: $status, phone: $phone, birthday: $birthday, points: $points, id: $id) {
    id,name,email,phone,birthday,points, createdAt, updatedAt
  }
}
`;

const mutationDelete = `
mutation Delete_User($id: ID!) {
  deleteUser(id: $id) {
    id,name,email,phone,birthday,points, createdAt, updatedAt
  }
}
`;



function SaveData(action, form_json) {
  if (!form_json && !(form_json.name || form_json.id)) {
    $('#msg-error').removeClass('d-none').find('.text-danger').html('Invalid data');
    return;
  }

  let mutation = '';
  switch (action) {
    case 'create':
      mutation = mutationAdd;
      break;
    case 'update':
      mutation = mutationEdit;
      break;
    case 'delete':
      mutation = mutationDelete;
      break;
  }

  if (!mutation)
    return;

  form_json.points = parseInt(form_json.points);
  $.ajax({
    beforeSend: function () {
      $('#msg-error').addClass('d-none');
    },
    contentType: 'application/json',
    url: mainHost, type: 'post',
    data: JSON.stringify({ query: mutation, variables: form_json }),
    success: function (res) {
      // console.log('success', res);
      if (!res)
        return;

      if (res.errors) {
        $('#msg-error').removeClass('d-none').find('.text-danger').html(res.errors[0].message);
        return;
      }

      if (res.data) {
        formHelper.closeForm();
        table_js.ajax.reload();
      }
    },
    error: function (ex) {
      console.log('Error', ex);
    }
  });
};

function LoadDataDropdown(id, callback) {
  Promise.all([GetUser(id)]).then(() => {
    if (typeof callback === 'function')
      callback();
  }).catch((ex) => {
    console.log('error', ex);
    if (typeof callback === 'function')
      callback();
  });
};

window.ShowEditModal = function (indx) {
  if (typeof indx !== 'number')
    return;

  if (!formHelper)
    return;

  let data = table_js.rows(indx).data()[0];
  // console.log('data', data);
  LoadDataDropdown(data.id, function () {
    data = preloadData.user;
    formHelper.showFormEdit(data, 'update', SaveData);
  });
};

window.ConfirmDelete = function(indx) {
  if (typeof indx !== 'number')
    return;

  if (!formHelper)
    return;

  const data = table_js.rows(indx).data()[0];
  formHelper.showFormConfirmDelete(data, 'delete', SaveData);
};

function GetUser(id) {
  return new Promise(function (resolve, reject) {
    if (!id) {
      preloadData.user = {};
      resolve();
      return;
    }

    $.ajax({
      contentType: 'application/json',
      url: mainHost, type: 'post',
      data: JSON.stringify({ query: getById, variables: { id } }),
      success: function (res) {
        preloadData.user = res.data.getUser;
        resolve();
      },
      error: function (ex) {
        // console.log('Error', ex);
        preloadData.user = {};
        resolve();
      }
    });
  });
};

window.InitPage = function (arrContent) {
  table_js = $('#dataTable').DataTable({
    'ajax': {
      'url': mainHost,
      type: 'post',
      data: { query },
      'dataSrc': 'data.users'
    },
    'columns': [
      { 'data': 'name' },
      { 'data': 'email' },
      {
        'data': 'posts.length', render: function (data, type, row) {
          //console.log('render', data, type, row)
          return accounting.formatNumber(row['posts'].length);
        }
      },
      {
        'data': 'points', render: function (data, type, row) {
          return accounting.formatNumber(row['points']);
        }
      },
      {
        'data': 'updatedAt',
        render: function (data, type, row) {
          return 'Created at:<br/>' + (row['createdAt'] ? Handlebars.helpers.formatTime(row['createdAt'], 'MMM Do YYYY, h:mm:ss a') : '') +
            '<br/>Updated at:<br/>' +
            (row['updatedAt'] ? `<span class='badge bg-info text-white'>` + Handlebars.helpers.formatTime(row['updatedAt'], 'MMM Do YYYY, h:mm:ss a') + '</span>' : '');
        }
      },
      {
        'data': '', 'orderable': false, className: 'project-actions text-right text-nowrap', render: function (data, type, row, meta) {
          return `
            <a class='btn btn-info btn-sm mx-1' href='javascript:ShowEditModal(${meta.row});'><i class='fas fa-pencil-alt'></i>
            Edit</a>
            <a class='btn btn-danger btn-sm' href='javascript:void(0);' onclick='ConfirmDelete(${meta.row});'><i class='fas fa-trash'></i>
            Delete</a>`;
        }
      }
    ]
  });

  $('#btn-add').click(function (e) {
    e.preventDefault();

    LoadDataDropdown('', function () {
      formHelper.showFormNew({ points: 0, status: 'active' }, 'create', SaveData);
    });
  });

  const form = arrContent.find((el) => { return el.name.toLowerCase() === 'user_form' });
  formHelper = new ModalForm({ formTemplate: form.content, entityName: 'User' });
};
