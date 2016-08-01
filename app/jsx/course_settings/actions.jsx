define ([
  'axios',
  'jquery',
  'i18n!actions',
  './helpers',
  'compiled/jquery.rails_flash_notifications'
], (axios, $, I18n, Helpers) => {

  const Actions = {

    gotCourseImage (imageUrl) {
      return {
        type: 'GOT_COURSE_IMAGE',
        payload: {
          imageUrl
        }
      };
    },

    setModalVisibility (showModal) {
      return {
        type: 'MODAL_VISIBILITY',
        payload: {
          showModal
        }
      };
    },

    rejectedUpload(type) {
      return {
        type: 'REJECTED_UPLOAD',
        payload: {
          rejectedFiletype: type
        }
      };
    },

    errorUploadingImage() {
      $.flashError(I18n.t("There was an error uploading the image"));
    },

    removeImage() {
      return {
        type: 'REMOVE_IMAGE'
      };
    },

    getCourseImage (courseId, ajaxLib = axios) {
      return (dispatch, getState) => {
        ajaxLib.get(`/api/v1/courses/${courseId}/settings`)
               .then((response) => {
                  dispatch(this.gotCourseImage(response.data.image, courseId));
                })
               .catch((response) => {
                  $.flashError(I18n.t("There was an error retrieving the course image"));
                });
      };
    },

    setCourseImageId (imageUrl, imageId) {
      return {
        type: 'SET_COURSE_IMAGE_ID',
        payload: {
          imageUrl,
          imageId
        }
      };
    },

    setCourseImageUrl (imageUrl) {
      return {
        type: 'SET_COURSE_IMAGE_URL',
        payload: {
          imageUrl
        }
      };
    },

    putImageData(courseId, imageUrl, imageId = null, ajaxLib = axios) {
      const data = imageId ? {"course[image_id]": imageId} : 
                             {"course[image_url]": imageUrl}; 

      return (dispatch, getState) => {
        this.ajaxPutFormData(`/api/v1/courses/${courseId}`, data, ajaxLib) 
          .then((response)=> {
              dispatch(imageId ? this.setCourseImageId(imageUrl, imageId) : 
                                 this.setCourseImageUrl(imageUrl)); 
          })
          .catch((response) => {
            this.errorUploadingImage();
          })
      }
    },

    putRemoveImage(courseId, ajaxLib = axios) {
      return (dispatch, getState) => {
        this.ajaxPutFormData(`/api/v1/courses/${courseId}`, {"course[remove_image]": true}, ajaxLib) 
          .then((response)=> {
            dispatch(this.removeImage());   
          })
          .catch((response) => {
            $.flashError(I18n.t("Error removing image"));
          })
      }
    },

    prepareSetImage (imageUrl, imageId, courseId, ajaxLib = axios) {
      if (imageUrl) {
        return this.putImageData(courseId, imageUrl, imageId, ajaxLib);
      } else {
        // In this case the url field was blank so we could either
        // recreate it or hit the API to get it.  We hit the api
        // to be safe.
        return (dispatch, getState) => {
          ajaxLib.get(`/api/v1/files/${imageId}`)
                 .then((response) => {
                   dispatch(this.putImageData(courseId, response.data.url, imageId, ajaxLib));
                 })
                 .catch((response) => {
                   this.errorUploadingImage();
                 });
        }
      }
    },

    uploadFlickrUrl (flickrUrl, ajaxLib = axios) {
      return (dispatch, getState) => {
        dispatch(this.setCourseImageUrl(flickrUrl));
      }
    },

    uploadFile (event, courseId, ajaxLib = axios) {
      event.preventDefault();
      return (dispatch, getState) => {
        const { type, file } = Helpers.extractInfoFromEvent(event);

        if (Helpers.isValidImageType(type)) {
          const data = {
            name: file.name,
            size: file.size,
            parent_folder_path: 'course_image',
            type
          };
          ajaxLib.post(`/api/v1/courses/${courseId}/files`, data)
                 .then((response) => {
                    const formData = Helpers.createFormData(response.data.upload_params);
                    formData.append('file', file);
                    ajaxLib.post(response.data.upload_url, formData)
                           .then((response) => {
                             dispatch(this.prepareSetImage(response.data.url, response.data.id, courseId, ajaxLib));
                           })
                           .catch((response) => {
                              this.errorUploadingImage();
                           });
                  })
                 .catch((response) => {
                    this.errorUploadingImage();
                 });
        } else {
          dispatch(this.rejectedUpload(type));
          $.flashWarning(I18n.t("'%{type}' is not a valid image type (try jpg, png, or gif)", {type}));
        }
      };
    },

    ajaxPutFormData(path, data, ajaxLib = axios) {
      return (
        ajaxLib.put(path, data, 
          {
            // TODO: this is a naive implementation,
            // upgrading to axios@0.12.0 will make it unnecessary 
            // by using URLSearchParams.
            transformRequest: function (data, headers) {
              return Object.keys(data).reduce((prev, key) => {
                return prev + (prev ? '&' : '') + `${key}=${data[key]}`;
              }, '');
            }
          })
        );
    }

  };

  return Actions;
});