import { Editor } from "@tinymce/tinymce-react";
import React, { useRef } from "react";

const RichTextEditor = ({ value, setValue }) => {
  const editorRef = useRef(null);

  return (
    <div>
      <Editor
        apiKey="wdyf4nogrjxtliypadxmekb5jj5ccf1nhdgiakpmmpwt53vx"
        value={value}
        onInit={(evt, editor) => (editorRef.current = editor)}
        onEditorChange={(content) => setValue(content)}
        init={{
          height: 250,
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
            "fullpage",
          ],

          toolbar:
            "undo redo | fontfamily fontsize blocks | " +
            "bold italic underline strikethrough | " +
            "alignleft aligncenter alignright alignjustify | " +
            "bullist numlist outdent indent | link image table | " +
            "code preview fullscreen | removeformat help",

          file_picker_types: "image",
          file_picker_callback: (cb, value, meta) => {
            let input = document.createElement("input");
            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/png, image/jpeg");

            input.onchange = function () {
              let file = this.files[0];
              let reader = new FileReader();
              reader.onload = function () {
                let id = "blobid" + new Date().getTime();
                let blobCache = editorRef.current.editorUpload.blobCache;
                let base64 = reader.result.split(",")[1];
                let blobInfo = blobCache.create(id, file, base64);
                blobCache.add(blobInfo);
                cb(blobInfo.blobUri(), { title: file.name });
              };
              reader.readAsDataURL(file);
            };

            input.click();
          },

          link_assume_external_targets: "https",
          link_default_protocol: "https",
          font_family_formats:
            "Arial=arial,helvetica,sans-serif;" +
            "Georgia=georgia,palatino;" +
            "Tahoma=tahoma,arial,helvetica,sans-serif;" +
            "Times New Roman=times new roman,times;" +
            "Verdana=verdana,geneva;" +
            "Courier New=courier new,courier;",

          content_style: `
            body {
              font-size: 16px;
              font-family: Arial, Helvetica, sans-serif;
              line-height: 1.6;
              color: #111827;
            }
            h1 { font-size: 2rem; font-weight: bold; margin: 1rem 0; }
            h2 { font-size: 1.75rem; font-weight: bold; margin: 1rem 0; }
            h3 { font-size: 1.5rem; font-weight: bold; margin: 0.75rem 0; }
            h4 { font-size: 1.25rem; font-weight: bold; margin: 0.5rem 0; }
            h5 { font-size: 1rem; font-weight: bold; margin: 0.5rem 0; }
            h6 { font-size: 0.875rem; font-weight: bold; margin: 0.5rem 0; }
            p { margin: 0.5rem 0; }
            ul, ol { margin: 0.75rem 0 0.75rem 1.5rem; padding: 0; }
            li { margin-bottom: 0.25rem; }
            a { color: #2563eb; text-decoration: underline; }
            a:hover { color: #1d4ed8; }
            b, strong { font-weight: bold; }
            i, em { font-style: italic; }
            u { text-decoration: underline; }
            blockquote {
              border-left: 4px solid #d1d5db;
              padding-left: 1rem;
              color: #4b5563;
              font-style: italic;
              margin: 1rem 0;
            }
            code {
              background-color: #f3f4f6;
              padding: 2px 4px;
              border-radius: 4px;
              font-family: monospace;
              font-size: 0.875rem;
            }
            pre {
              background-color: #1f2937;
              color: #f9fafb;
              padding: 1rem;
              border-radius: 6px;
              overflow-x: auto;
              font-size: 0.875rem;
              font-family: monospace;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1rem 0;
            }
            table, th, td { border: 1px solid #d1d5db; }
            th, td { padding: 8px; text-align: left; }
            th { background: #f3f4f6; font-weight: bold; }
            tr:nth-child(even) { background: #f9fafb; }
            img {
              max-width: 100%;
              height: auto;
              border-radius: 6px;
              margin: 0.5rem 0;
            }
            hr {
              border: 0;
              border-top: 1px solid #e5e7eb;
              margin: 1.5rem 0;
            }
          `,
        }}
      />
    </div>
  );
};

export default RichTextEditor;
