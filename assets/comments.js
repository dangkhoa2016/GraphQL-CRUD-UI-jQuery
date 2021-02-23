var t = null;

var addition_file = { path: '/content/comment_form.html', name: 'comment_form' };
var formHelper = null;

function SaveData(action, form_json) {
  if (form_json && (form_json.comment || form_json.id)) {
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

    form_json.userId = parseInt(form_json.userId);
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


var queryUsers = `
query { 
  users { id, name, email, createdAt, updatedAt }
}
`

var queryPosts = `
query { 
  posts { id, title, createdAt, updatedAt }
}
`

function GetPosts() {
  return new Promise(function (resolve, reject) {
    $.ajax({
      contentType: 'application/json',
      url: mainHost, type: 'post',
      data: JSON.stringify({ query: queryPosts }),
      success: function (res) {
        preloadData.posts = res.data.posts;
        resolve();
      },
      error: function (ex) {
        // console.log('Error', ex);
        preloadData.posts = [];
        resolve();
      }
    });
  });
}

function GetUsers() {
  return new Promise(function (resolve, reject) {
    $.ajax({
      contentType: 'application/json',
      url: mainHost, type: 'post',
      data: JSON.stringify({ query: queryUsers }),
      success: function (res) {
        preloadData.users = res.data.users;
        resolve();
      },
      error: function (ex) {
        // console.log('Error', ex);
        preloadData.users = [];
        resolve();
      }
    });
  });
}

var preloadData = {
  users: [],
  posts: []
}

function LoadDataDropdown(callback) {
  Promise.all([GetPosts(), GetUsers()]).then(() => {
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
      LoadDataDropdown(function () {
        data.users = preloadData.users;
        data.posts = preloadData.posts;
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
  comments { id, comment, status, createdAt, updatedAt, user { id, email, name }, post{id, title} }
}
`
var getById = `
query Get_Comment($id: ID!) {
  comment(where: {id: $id}) {
    id,comment,status,createdAt,updatedAt
    post {
      id,title
    }
    user {
      id,name,email
    }
  }
}
`;

var mutationAdd = `
mutation Add_Comment($comment: String!, $status: String, $userId: ID!, $postId: ID!) {
  addComment(comment: $comment,
    status: $status, userId: $userId, postId: $postId) {
    id, comment, status, createdAt, updatedAt, user { id, email, name }, post { id, title }
  }
}
`

var mutationEdit = `
mutation Edit_Comment($comment: String!, $status: String, $userId: ID!, $postId: ID!, $id: ID!) {
  updateComment(comment: $comment,
    status: $status, userId: $userId, postId: $postId, id: $id) {
    id, comment, status, createdAt, updatedAt, user { id, email, name }, post { id, title }
  }
}
`

var mutationDelete = `
mutation Delete_Comment($id: ID!) {
  deleteComment(id: $id) {
    id, comment, status, createdAt, updatedAt, user { id, email, name }, post { id, title }
  }
}
`

function InitPage(arrContent) {
  t = $('#dataTable').DataTable({
    "ajax": {
      "url": mainHost,
      type: 'post',
      data: { query },
      "dataSrc": "data.comments"
    },
    "columns": [
      {
        "data": "comment", render: function (data, type, row) {
          return TruncateLongString(row['comment'], 100, true);
        }
      },
      {
        "data": "post.title"
      },
      {
        "data": "user", render: function (data, type, row) {
          return 'Name: ' + row['user']['name'] +
            '<br/>' + 'Email: ' + row['user']['email'];
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

    LoadDataDropdown(function () {
      formHelper.showFormNew({ status: 'active', users: preloadData.users, posts: preloadData.posts }, 'create', SaveData);
    });
  });

  var form = arrContent.find((el) => { return el.name.toLowerCase() === 'comment_form' });
  formHelper = new ModalForm({ formTemplate: form.content, entityName: 'Comment' });
}

