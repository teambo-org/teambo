package main

import (
	"bytes"
	"flag"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
	"text/template"
)

type page struct {
	Package    string
	Assets     []file
	Templates  []file
	Templatejs []file
}
type file struct {
	Path  string
	Value string
}

func main() {
	pkg := flag.String("pkg", "main", "Package name for compiled assets")
	asset_list := flag.String("assets", "public", "Asset directories (comma separated)")
	template_list := flag.String("templates", "template", "Template directories (comma separated)")
	flag.Parse()
	asset_dirs := strings.Split(*asset_list, ",")
	template_dirs := strings.Split(*template_list, ",")
	p := page{
		Package:    *pkg,
		Assets:     []file{},
		Templates:  []file{},
		Templatejs: []file{},
	}
	for _, dir := range asset_dirs {
		dir_files := CollectFiles(dir)
		for k, v := range dir_files {
			p.Assets = append(p.Assets, file{"/" + k, v})
		}
	}
	for _, dir := range template_dirs {
		dir_files := CollectFiles(dir)
		for k, v := range dir_files {
			if strings.HasSuffix(k, ".mustache") {
				tplname := strings.TrimSuffix(k, ".mustache")
				p.Templates = append(p.Templates, file{tplname, v})
			}
			if strings.HasSuffix(k, ".js") {
				tplname := strings.TrimSuffix(k, ".js")
				p.Templatejs = append(p.Templatejs, file{tplname, v})
			}
		}
	}
	t := template.Must(template.New("compiled").Parse(_template))
	b := &bytes.Buffer{}
	err := t.Execute(b, p)
	if err != nil {
		log.Println(err)
		return
	}
	ioutil.WriteFile("compiled.go", b.Bytes(), 0644)
}

func CollectFiles(basepath string) (files map[string]string) {
	files = make(map[string]string)
	scan := func(path string, f os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !f.IsDir() {
			file, _ := ioutil.ReadFile(path)
			files[path] = "`" + strings.Replace(string(file), "`", "` + \"`\" + `", -1) + "`"
		}
		return nil
	}
	filepath.Walk(basepath, scan)
	return files
}

var _template = `package {{.Package}}

var _compiled_assets = map[string]string {
	{{range .Assets}}"{{.Path}}": {{.Value}},
	{{end}}
}

var _compiled_templates = map[string]string {
	{{range .Templates}}"{{.Path}}": {{.Value}},
	{{end}}
}

var _compiled_templatejs = map[string]string {
	{{range .Templatejs}}"{{.Path}}": {{.Value}},
	{{end}}
}
`
