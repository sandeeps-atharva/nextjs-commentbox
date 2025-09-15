import { Editor } from "@tinymce/tinymce-react";
import React from "react";

const RichTextEditor = ({ value, setValue }) => {
  return (
    <div>
      <Editor
        apiKey="wdyf4nogrjxtliypadxmekb5jj5ccf1nhdgiakpmmpwt53vx"
        value={value}
        onEditorChange={(newValue) => setValue(newValue)}
        init={{
          height: 250,
          menubar: false,
          menubar: false,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "help",
            "wordcount",
          ],
          toolbar:
            "undo redo | fontfamily fontsize blocks |" +
            " | bold italic underline strikethrough | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | link image table | " +
            "code preview fullscreen | removeformat help | link",
          link_assume_external_targets: "https",
          link_default_protocol: "https",
          branding: false,
          font_family_formats:
            "Arial=arial,helvetica,sans-serif;" +
            "Georgia=georgia,palatino;" +
            "Tahoma=tahoma,arial,helvetica,sans-serif;" +
            "Times New Roman=times new roman,times;" +
            "Verdana=verdana,geneva;" +
            "Courier New=courier new,courier;",
          content_style: `
          body {
            font-size: 20px;
          }
          ::placeholder {
            color: #1e40af; /* Tailwind blue-900 */
            opacity: 1;
          }
        `,
        }}
      />
    </div>
  );
};

export default RichTextEditor;
