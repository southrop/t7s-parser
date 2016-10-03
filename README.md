# T7S Script Parser/Injector

Simple script to parse/extract/inject text from and into script files for
*Tokyo 7th Sisters*.

## Usage

#### Extract
`node lib/extract filename.txt`

Extracts text strings from the script file and produces a dictionary.

Produces
* `filename.json` - a Key-Value JSON dictionary consisting of variables and their corresponding text strings
`filename_inject.txt` - a text file with text strings extracted and replaced with variables

#### Inject
`node lib/inject filename.txt`

Use the filename of the original file in the command. Make sure `filename.json` and `filename_inject.txt` are present in the same directory.

Produces
* `filename_injected.txt` - a text file with variables replaced by strings contained in `filename.json`
