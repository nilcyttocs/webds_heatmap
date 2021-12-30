import {
  createTheme,
} from "@mui/material/styles";


const webdsTheme = createTheme({
  palette: {
    primary: {
      main: "#007DC3"
    },
    secondary: {
      main: "#A33E7F"
    },
  },
  //spacing: 8,
  components: {
        MuiButton: {
          styleOverrides: {
            root: { padding: 5 },
          },
        },
		MuiAvatar: {
          defaultProps: {
            sx: {
              bgcolor: "#007DC3"
            },
        }
      }
    }, 
});


export default webdsTheme