var t = null;

var addition_file = { path: '/content/post_form.html', name: 'post_form' };
var formHelper = null;



function SaveData(action, form_json) {
    if (form_json && (form_json.title || form_json.id)) {
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

function GetPost(id) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            contentType: 'application/json',
            url: mainHost, type: 'post',
            data: JSON.stringify({ query: getById, variables: { id } }),
            success: function (res) {
                preloadData.post = res.data.getPost;
                resolve();
            },
            error: function (ex) {
                // console.log('Error', ex);
                preloadData.post = {};
                resolve();
            }
        });
    });
}

var preloadData = {
    users: [],
    post: {}
}

function LoadDataDropdown(id, callback) {
    Promise.all([GetUsers(), GetPost(id)]).then(() => {
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
        if (formHelper) {
            LoadDataDropdown(data.id, function () {
                data.users = preloadData.users;
                data.content = (preloadData.post.content || '');
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
  posts { id, title, summary, photo, createdAt, updatedAt, status, user { id, email, name }}
}
`
var getById = `
query Get_Post($id: ID!) {
  getPost(id: $id) { id, title, summary, content, photo, comments{id}, createdAt, updatedAt, status, user { id, email, name }}
}
`;

var mutationAdd = `
mutation Add_Post($title: String!, $content: String!, $summary: String!,
  $photo: String, $status: String, $userId: ID!) {
  addPost(title: $title, content: $content, summary: $summary,
    photo: $photo, status: $status, userId: $userId) {
    id, title, content, status, photo, createdAt, updatedAt, user { id, email, name }
  }
}
`

var mutationEdit = `
mutation Edit_Post($title: String!, $content: String!, $summary: String!,
  $photo: String, $status: String, $userId: ID!, $id: ID!) {
  updatePost(title: $title, content: $content, summary: $summary,
    photo: $photo, status: $status, userId: $userId, id: $id) {
    id, title, content, status, photo, createdAt, updatedAt, user { id, email, name }
  }
}
`

var mutationDelete = `
mutation Delete_Post($id: ID!) {
  deletePost(id: $id) {
    id, title, content, summary, status, photo, createdAt, updatedAt, user { id, email, name }
  }
}
`

function InitPage(arrContent) {
    t = $('#dataTable').DataTable({
        "ajax": {
            "url": mainHost,
            type: 'post',
            data: { query },
            "dataSrc": "data.posts"
        },
        "columns": [
            { "data": "title" },
            {
                "data": "summary", render: function (data, type, row) {
                    return TruncateLongString(row['summary'], 100, true);
                }
            },
            {
                "data": "photo", render: function (data, type, row) {
                    return '<img src="' + row['photo'] + '" alt="' + row['title'] + '" />';
                }
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
        LoadDataDropdown('', function () {
            formHelper.showFormNew({ status: 'active', users: preloadData.users }, 'create', SaveData);
        });
    });

    var form = arrContent.find((el) => { return el.name.toLowerCase() === 'post_form' });
    formHelper = new ModalForm({ formTemplate: form.content, entityName: 'Post' });
}

