package util

import (
	"bufio"
	"bytes"
	"io"
)

type Logfilter struct {
	W       io.Writer
	Filters [][]byte
}

func (f Logfilter) Write(p []byte) (int, error) {
	var written int
	reader := bufio.NewReader(bytes.NewReader(p))
	line, _ := reader.ReadBytes('\n')
	for len(line) > 0 {
		for _, filter := range f.Filters {
			if bytes.Contains(line, filter) {
				line, _ = reader.ReadBytes('\n')
				continue
			}
		}
		n, err := f.W.Write(line)
		written += n
		if err != nil {
			return written, err
		}
		line, _ = reader.ReadBytes('\n')
	}
	return len(p), nil
}
