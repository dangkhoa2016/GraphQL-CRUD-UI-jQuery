var t = null;

var addition_file = { path: '/content/user_form.html', name: 'user_form' };
var formHelper = null;

function SaveData(action, form_json) {
  if (form_json && (form_json.name || form_json.id)) {
    var mutation = '';
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
        if (res) {
          if (res.errors) {
            $('#msg-error').removeClass('d-none').find('.text-danger').html(res.errors[0].message);
            return;
          }
          if (res.data) {
            formHelper.closeForm();
            t.ajax.reload();
          }
        }
      },
      error: function (ex) {
        console.log('Error', ex);
      }
    });
  } else {
    $('#msg-error').removeClass('d-none').find('.text-danger').html('Invalid data');
  }
}

function LoadDataDropdown(id, callback) {
    Promise.all([GetUser(id)]).then(() => {
        //console.log('done', preloadData);
        if (typeof callback === 'function')
            callback();
    }).catch((ex) => {
        console.log('error', ex);
        if (typeof callback === 'function')
            callback();
    });
}

function ShowEditModal(indx) {
    if (typeof indx === "number") {
        var data = t.rows(indx).data()[0];
        // console.log('data', data);
        if (formHelper) {
            LoadDataDropdown(data.id, function () {
                data = preloadData.user;
                formHelper.showFormEdit(data, 'update', SaveData);
            });
        }
    }
}


function ConfirmDelete(indx) {
  if (typeof indx === "number") {
    var data = t.rows(indx).data()[0];
    if (formHelper) {
      formHelper.showFormConfirmDelete(data, 'delete', SaveData);
    }
  }
}


var query = `
query { 
  users { id, name, email, status, phone, createdAt, updatedAt
    , points, posts { id, title }, comments {id, comment} }
}
`

var getById = `
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

var mutationAdd = `
mutation Add_User($name: String!, $email: String!, $phone: String, $status: String, $birthday: String, $points: Int) {
  addUser(name: $name, email: $email, status: $status, phone: $phone, birthday: $birthday, points: $points) {
    id,name,email,phone,birthday,points, createdAt, updatedAt
  }
}
`

var mutationEdit = `
mutation Edit_User($name: String!, $email: String!, $phone: String, $status: String, $birthday: String, $points: Int, $id: ID!) {
  updateUser(name: $name, email: $email, status: $status, phone: $phone, birthday: $birthday, points: $points, id: $id) {
    id,name,email,phone,birthday,points, createdAt, updatedAt
  }
}
`

var mutationDelete = `
mutation Delete_User($id: ID!) {
  deleteUser(id: $id) {
    id,name,email,phone,birthday,points, createdAt, updatedAt
  }
}
`

function GetUser(id) {
    return new Promise(function (resolve, reject) {
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
}

var preloadData = {
    user: {}
}

function InitPage(arrContent) {
  t = $('#dataTable').DataTable({
    "ajax": {
      "url": mainHost,
      type: 'post',
      data: { query },
      "dataSrc": "data.users"
    },
    "columns": [
      { "data": "name" },
      { "data": "email" },
      {
        "data": "posts.length", render: function (data, type, row) {
          //console.log('render', data, type, row)
          return accounting.formatNumber(row['posts'].length);
        }
      },
      {
        "data": "points", render: function (data, type, row) {
          return accounting.formatNumber(row['points']);
        }
      },
      {
        "data": "updatedAt",
        render: function (data, type, row) {
          return 'Created at:<br/>' + (row['createdAt'] ? Handlebars.helpers.formatTime(row['createdAt'], "MMM Do YYYY, h:mm:ss a") : '') + '<br/>Updated at:<br/>' +
            (row['updatedAt'] ? '<span class="badge bg-info text-white">' + Handlebars.helpers.formatTime(row['updatedAt'], "MMM Do YYYY, h:mm:ss a") + '</span>' : '');
        }
      },
      {
        "data": "", "orderable": false, className: ' project-actions text-right text-nowrap', render: function (data, type, row, meta) {
          return `
            <a class="btn btn-info btn-sm mx-1" href="javascript:ShowEditModal(`+ meta.row + `);"><i class="fas fa-pencil-alt"></i>
            Edit</a>
            <a class="btn btn-danger btn-sm" href="javascript:void(0);" onclick="ConfirmDelete(`+ meta.row + `);"><i class="fas fa-trash"></i>
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

  var form = arrContent.find((el) => { return el.name.toLowerCase() === 'user_form' });
  formHelper = new ModalForm({ formTemplate: form.content, entityName: 'User' });
}

