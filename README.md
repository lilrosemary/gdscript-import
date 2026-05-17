# GDScript Import

Do you also want your GDScript to be as type-safe as possible, but you don't want all classes to be global? Do you import classes like you do in real programming languages? Then this extension is for you.

It provides code action to add preload for non-global class to quickly "import" the script. Assumes the snakecase filenames.

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/17dbf3ce-31c5-4fa4-9859-e23484aaeba3" />
<img width="400" alt="Image" src="https://github.com/user-attachments/assets/a6eb05b0-b35a-4bf1-8d04-bc9a445aecac" />

## Installation

Install dependencies with `npm i`, then build the extension with `npm run package` and finally install the created package e.g. with
```
vscodium --install-extension ./gdscript-import-1.0.0.vsix
```


## Todo

I want non-global classes to be present in the autocomplete even though they are not preloaded yet.

--

Vibecode disclosure: I authored like 4 lines of code total here.

